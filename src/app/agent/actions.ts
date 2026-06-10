"use server";

// Серверные действия кабинета агента. Каждое (кроме логина) требует залогиненного
// агента и жёстко фильтрует данные по agentId — агент не может затронуть чужое.
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  setAgentSession,
  clearAgentSession,
  requireAgent,
} from "@/lib/agent-auth";

const FILES_ROOT = path.resolve("agent-files");
const MAX_FILE = 200 * 1024 * 1024; // 200 МБ на файл

// --- Анти-перебор по IP ---
const MAX_FAILS = 6;
const LOCK_MS = 10 * 60 * 1000;
const fails = new Map<string, { n: number; until: number }>();

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// --- Аутентификация ---
export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await clientIp();
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && rec.until > now) {
    return { error: "Слишком много попыток. Попробуйте через несколько минут." };
  }

  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fail = () => {
    const n = (rec?.n ?? 0) + 1;
    fails.set(ip, { n, until: n >= MAX_FAILS ? now + LOCK_MS : 0 });
  };

  const agent = username ? await prisma.agent.findUnique({ where: { username } }) : null;
  // одинаковая ветка по времени: всегда проверяем пароль (против тайминг-атак по наличию юзера)
  const ok =
    agent && agent.isActive
      ? verifyPassword(password, agent.passwordHash)
      : verifyPassword(password, "scrypt$0$0");

  if (!agent || !agent.isActive || !ok) {
    fail();
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Неверный логин или пароль." };
  }

  fails.delete(ip);
  await setAgentSession(agent.id);
  redirect("/agent");
}

export async function logout() {
  await clearAgentSession();
  redirect("/agent/login");
}

// --- Вход через Telegram (подтверждение ботом) ---
const BOT_USERNAME = "preipoprobot";

export async function requestTgLogin(): Promise<{ code: string; link: string }> {
  // чистим протухшие коды (>5 мин), чтобы таблица не копила мусор
  await prisma.loginCode
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } } })
    .catch(() => {});
  const code = randomBytes(8).toString("hex"); // 16 hex-символов (64 бита)
  await prisma.loginCode.create({ data: { code } });
  return { code, link: `https://t.me/${BOT_USERNAME}?start=login_${code}` };
}

export async function pollTgLogin(code: string): Promise<{ ok: boolean }> {
  if (!code) return { ok: false };
  const lc = await prisma.loginCode.findUnique({ where: { code } });
  if (!lc) return { ok: false };
  if (Date.now() - lc.createdAt.getTime() > 5 * 60 * 1000) {
    await prisma.loginCode.delete({ where: { code } }).catch(() => {});
    return { ok: false };
  }
  if (!lc.agentId) return { ok: false }; // бот ещё не подтвердил
  const agent = await prisma.agent.findFirst({ where: { id: lc.agentId, isActive: true } });
  await prisma.loginCode.delete({ where: { code } }).catch(() => {});
  if (!agent) return { ok: false };
  await setAgentSession(agent.id);
  return { ok: true };
}

// --- Клиенты ---
export async function addClient(formData: FormData) {
  const agent = await requireAgent();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.client.create({
    data: {
      agentId: agent.id,
      name,
      contact: String(formData.get("contact") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });
  revalidatePath("/agent");
}

export async function deleteClient(formData: FormData) {
  const agent = await requireAgent();
  const id = String(formData.get("id") || "");
  // deleteMany c agentId — нельзя удалить чужого
  await prisma.client.deleteMany({ where: { id, agentId: agent.id } });
  revalidatePath("/agent");
  redirect("/agent");
}

// --- Продажи ---
export async function addSale(formData: FormData) {
  const agent = await requireAgent();
  const clientId = String(formData.get("clientId") || "");
  // клиент должен принадлежать агенту
  const client = await prisma.client.findFirst({ where: { id: clientId, agentId: agent.id } });
  if (!client) return;

  const num = (k: string) => {
    const v = parseFloat(String(formData.get(k) || "").replace(",", "."));
    return Number.isFinite(v) ? v : null;
  };

  const amount = num("amount") ?? 0;
  const companyName = String(formData.get("companyName") || "").trim() || "—";

  // Ожидаемый мультипликатор выхода: из формы, иначе из проекта (оценка выхода ÷ входа)
  let mult = num("expMultiple");
  if (mult == null) {
    const proj = await prisma.project.findFirst({ where: { name: companyName } });
    if (proj?.valuation && proj?.exitValuation && proj.valuation > 0) {
      mult = proj.exitValuation / proj.valuation;
    } else if (proj?.cocMultiple) {
      mult = proj.cocMultiple;
    }
  }
  if (!mult || mult <= 0) mult = 1;

  // Вход 5% от суммы; прибыль клиента → SF 20% от прибыли → партнёр забирает ¼ SF
  const grossProfit = amount * Math.max(0, mult - 1);
  const entryFee = Math.round(amount * 0.05 * 100) / 100;
  const sf = Math.round(grossProfit * 0.2 * 100) / 100;
  const partner = Math.round((sf / 4) * 100) / 100;

  await prisma.sale.create({
    data: {
      agentId: agent.id,
      clientId: client.id,
      projectId: String(formData.get("projectId") || "") || null,
      companyName,
      round: String(formData.get("round") || "").trim() || null,
      expMultiple: Math.round(mult * 100) / 100,
      yearsToExit: num("yearsToExit"),
      amount,
      units: num("units"),
      pricePerUnit: num("pricePerUnit"),
      currency: String(formData.get("currency") || "USD"),
      entryFee, // комиссия за вход (5% суммы)
      commission: partner, // доля партнёра в SF (¼)
      sf, // success fee = 20% прибыли клиента
      commissionPaid: formData.get("commissionPaid") === "on",
      note: String(formData.get("note") || "").trim() || null,
    },
  });
  revalidatePath(`/agent/clients/${client.id}`);
  revalidatePath("/agent");
}

export async function updateSale(formData: FormData) {
  const agent = await requireAgent();
  const id = String(formData.get("saleId") || "");
  const existing = await prisma.sale.findFirst({ where: { id, agentId: agent.id } });
  if (!existing) return;

  const num = (k: string) => {
    const v = parseFloat(String(formData.get(k) || "").replace(",", "."));
    return Number.isFinite(v) ? v : null;
  };
  const amount = num("amount") ?? 0;
  const companyName = String(formData.get("companyName") || "").trim() || "—";

  let mult = num("expMultiple");
  if (mult == null) {
    const proj = await prisma.project.findFirst({ where: { name: companyName } });
    if (proj?.valuation && proj?.exitValuation && proj.valuation > 0) mult = proj.exitValuation / proj.valuation;
    else if (proj?.cocMultiple) mult = proj.cocMultiple;
  }
  if (!mult || mult <= 0) mult = 1;

  const grossProfit = amount * Math.max(0, mult - 1);
  const entryFee = Math.round(amount * 0.05 * 100) / 100;
  const sf = Math.round(grossProfit * 0.2 * 100) / 100;
  const partner = Math.round((sf / 4) * 100) / 100;

  await prisma.sale.update({
    where: { id: existing.id },
    data: {
      companyName,
      round: String(formData.get("round") || "").trim() || null,
      expMultiple: Math.round(mult * 100) / 100,
      yearsToExit: num("yearsToExit"),
      amount,
      pricePerUnit: num("pricePerUnit"),
      currency: String(formData.get("currency") || "USD"),
      entryFee,
      commission: partner,
      sf,
      commissionPaid: formData.get("commissionPaid") === "on",
      note: String(formData.get("note") || "").trim() || null,
    },
  });
  revalidatePath(`/agent/clients/${existing.clientId}`);
  redirect(`/agent/clients/${existing.clientId}`);
}

export async function toggleCommissionPaid(formData: FormData) {
  const agent = await requireAgent();
  const id = String(formData.get("id") || "");
  const sale = await prisma.sale.findFirst({ where: { id, agentId: agent.id } });
  if (!sale) return;
  await prisma.sale.update({ where: { id: sale.id }, data: { commissionPaid: !sale.commissionPaid } });
  revalidatePath(`/agent/clients/${sale.clientId}`);
  revalidatePath("/agent");
}

export async function deleteSale(formData: FormData) {
  const agent = await requireAgent();
  const id = String(formData.get("id") || "");
  const sale = await prisma.sale.findFirst({ where: { id, agentId: agent.id } });
  if (!sale) return;
  await prisma.sale.deleteMany({ where: { id: sale.id, agentId: agent.id } });
  revalidatePath(`/agent/clients/${sale.clientId}`);
  revalidatePath("/agent");
}

// --- Документы/видео (файл вне /public) ---
export async function uploadDocument(formData: FormData) {
  const agent = await requireAgent();
  const clientId = String(formData.get("clientId") || "");
  const client = await prisma.client.findFirst({ where: { id: clientId, agentId: agent.id } });
  if (!client) return;

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;
  if (file.size > MAX_FILE) return;

  const id = randomUUID();
  const dir = path.join(FILES_ROOT, agent.id);
  await mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^\w.\-а-яё ]+/gi, "_").slice(0, 120) || "file";
  const stored = path.join(dir, `${id}-${safeName}`);
  await writeFile(stored, Buffer.from(await file.arrayBuffer()));

  await prisma.clientDocument.create({
    data: {
      id,
      agentId: agent.id,
      clientId: client.id,
      title: String(formData.get("title") || "").trim() || safeName,
      kind: String(formData.get("kind") || "doc"),
      filePath: stored,
      fileName: safeName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    },
  });
  revalidatePath(`/agent/clients/${client.id}`);
}

export async function deleteDocument(formData: FormData) {
  const agent = await requireAgent();
  const id = String(formData.get("id") || "");
  const doc = await prisma.clientDocument.findFirst({ where: { id, agentId: agent.id } });
  if (!doc) return;
  try {
    await unlink(doc.filePath);
  } catch {
    /* файла уже нет — не страшно */
  }
  await prisma.clientDocument.deleteMany({ where: { id: doc.id, agentId: agent.id } });
  revalidatePath(`/agent/clients/${doc.clientId}`);
}
