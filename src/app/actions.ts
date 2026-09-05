"use server";

// Серверное действие: посетитель оставляет заявку -> лид падает в базу
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type LeadState = {
  ok?: boolean;
  error?: string;
};

// --- Антиспам ---
// Лимит заявок по IP (in-memory, сбрасывается при рестарте) + honeypot + лимиты длины.
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 минут
const hits = new Map<string, number[]>();

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

function cap(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s;
}

export async function submitLead(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  // Honeypot: скрытое поле «company» заполняют только боты — тихо игнорируем.
  if (String(formData.get("company") || "").trim()) {
    return { ok: true };
  }

  const ip = await clientIp();
  if (rateLimited(ip)) {
    return { error: "Слишком много заявок. Попробуйте позже." };
  }

  const name = cap(String(formData.get("name") || "").trim(), 120);
  const contact = cap(String(formData.get("contact") || "").trim(), 200);
  const message = cap(String(formData.get("message") || "").trim(), 2000);
  let projectId = cap(String(formData.get("projectId") || "").trim(), 64) || null;
  const consent = formData.get("consent") != null;

  if (!name || !contact) {
    return { error: "Укажите имя и контакт для связи." };
  }
  if (!consent) {
    return { error: "Нужно согласие на обработку персональных данных." };
  }

  // projectId мог устареть (проект удалён/скрыт между загрузкой и отправкой) —
  // тогда FK уронил бы всю заявку. Нормализуем в null, чтобы не потерять лид.
  if (projectId) {
    const exists = await prisma.project.findFirst({
      where: { id: projectId, isActive: true },
      select: { id: true },
    });
    if (!exists) projectId = null;
  }

  try {
    await prisma.lead.create({
      data: {
        name,
        contact,
        message: message || null,
        projectId,
      },
    });
    // Мгновенное уведомление оператору в Telegram (если настроено в env)
    await notifyOperator({ name, contact, message, projectId });
    return { ok: true };
  } catch {
    return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}

// Шлёт уведомление о новой заявке в Telegram оператора. Fire-and-forget.
async function notifyOperator(lead: {
  name: string;
  contact: string;
  message: string;
  projectId: string | null;
}) {
  // Фолбэк на уже настроенные переменные бота-ассистента, чтобы заявки
  // доходили до владельца в Telegram даже без отдельных NOTIFY-переменных.
  const token = process.env.TELEGRAM_NOTIFY_TOKEN || process.env.AGENT_BOT_TOKEN;
  const chat = process.env.TELEGRAM_NOTIFY_CHAT || process.env.AUTHORIZED_CHAT_ID;
  if (!token || !chat) return;
  let project = "";
  if (lead.projectId) {
    try {
      const p = await prisma.project.findUnique({
        where: { id: lead.projectId },
        select: { name: true },
      });
      if (p) project = `\nПроект: ${p.name}`;
    } catch {}
  }
  const text = `🔔 Новая заявка на pre-ipo.pro\nИмя: ${lead.name}\nКонтакт: ${lead.contact}${project}\nКомментарий: ${lead.message || "—"}`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000), // не даём медленному Telegram задерживать ответ формы
    });
  } catch {
    // не валим заявку, если уведомление не ушло
  }
}
