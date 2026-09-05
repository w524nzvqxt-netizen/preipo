// Аутентификация админки через httpOnly-cookie.
// В куке лежит ПОДПИСАННЫЙ (HMAC) токен сессии со сроком, а не детерминированный
// хэш пароля. Секрет подписи берётся из SESSION_SECRET; если он не задан —
// генерируется СЛУЧАЙНЫЙ секрет на время жизни процесса. Так куку нельзя
// подделать по коду из публичного репозитория (раньше значение куки было
// детерминированным хэшом с публичной константой-фолбэком — её мог вычислить
// кто угодно и войти без пароля). Минус случайного секрета: сессии сбрасываются
// при рестарте/редеплое — задайте SESSION_SECRET в окружении для стабильных сессий.
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";
const TTL = 60 * 60 * 24 * 7; // 7 дней

// Разрешённые пароли админки как SHA-256 (сам пароль в репозитории НЕ хранится).
// Можно задать дополнительные хэши через ADMIN_PASSWORD_HASHES (через запятую).
const EXTRA_HASHES = new Set<string>(
  [
    "49a8a113f177943a3b9081974e701f83b9f5c94ed96233be189786cf7b4bc4b7", // текущий пароль оператора
    ...(process.env.ADMIN_PASSWORD_HASHES || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ].filter(Boolean)
);

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function envPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

// Секрет подписи сессии. Приоритет — SESSION_SECRET (стабильные сессии между
// рестартами). Иначе — случайный секрет процесса: НИКОГДА публичная константа.
const RUNTIME_SECRET = randomBytes(32).toString("hex");
function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  return RUNTIME_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

// Сравнение строк/hex постоянного времени
function eqStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
function eqHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Пароль верен, если совпал с ADMIN_PASSWORD из окружения ИЛИ с разрешённым хэшом.
export function checkPassword(password: string): boolean {
  if (!password) return false;
  const h = sha256(password);
  const p = envPassword();
  if (p && eqHex(h, sha256(p))) return true;
  return EXTRA_HASHES.has(h);
}

// Токен сессии: `${exp}.${hmac("admin.${exp}")}` — подписан секретом, со сроком.
function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  return `${exp}.${sign(`admin.${exp}`)}`;
}

export async function setSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  if (!v) return false;
  const dot = v.indexOf(".");
  if (dot <= 0) return false;
  const exp = v.slice(0, dot);
  const mac = v.slice(dot + 1);
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  return eqStr(mac, sign(`admin.${exp}`));
}
