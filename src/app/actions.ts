"use server";

// Серверное действие: посетитель оставляет заявку -> лид падает в базу
import { prisma } from "@/lib/prisma";

export type LeadState = {
  ok?: boolean;
  error?: string;
};

export async function submitLead(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const projectId = String(formData.get("projectId") || "").trim() || null;
  const consent = formData.get("consent") != null;

  if (!name || !contact) {
    return { error: "Укажите имя и контакт для связи." };
  }
  if (!consent) {
    return { error: "Нужно согласие на обработку персональных данных." };
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
  const token = process.env.TELEGRAM_NOTIFY_TOKEN;
  const chat = process.env.TELEGRAM_NOTIFY_CHAT;
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
    });
  } catch {
    // не валим заявку, если уведомление не ушло
  }
}
