// Аутентификация кабинета агента (/agent).
// — пароль хранится как scrypt-хэш (scrypt$salt$hash), сам пароль нигде не лежит;
// — сессия: подписанный HMAC-токен в httpOnly+SameSite=Strict cookie, с истечением;
// — на каждом запросе проверяем подпись, срок и что агент ещё isActive.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "agent_session";
const TTL = 60 * 60 * 12; // 12 часов

function secret(): string {
  const s = process.env.AGENT_SESSION_SECRET;
  // fail-closed: без секрета сессии не подписываются (вход невозможен)
  return s && s.length >= 16 ? s : "";
}

// --- Пароли (scrypt) ---
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${dk}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const dk = scryptSync(pw, salt, 64);
  const h = Buffer.from(hash, "hex");
  return dk.length === h.length && timingSafeEqual(dk, h);
}

// --- Токен сессии (HMAC) ---
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken(agentId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const payload = `${agentId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): string | null {
  if (!secret()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [agentId, exp, mac] = parts;
  const expected = sign(`${agentId}.${exp}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return agentId;
}

export async function setAgentSession(agentId: string) {
  if (!secret()) return;
  const store = await cookies();
  store.set(COOKIE, makeToken(agentId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TTL,
  });
}

export async function clearAgentSession() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// Текущий агент по сессии (или null). Проверяет подпись, срок и isActive.
export async function getAgent() {
  const store = await cookies();
  const tok = store.get(COOKIE)?.value;
  if (!tok) return null;
  const agentId = verifyToken(tok);
  if (!agentId) return null;
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || !agent.isActive) return null;
  return agent;
}

// Требует залогиненного агента, иначе редирект на вход.
export async function requireAgent() {
  const agent = await getAgent();
  if (!agent) redirect("/agent/login");
  return agent;
}
