// Аутентификация админки через httpOnly-cookie.
// В куке лежит НЕ сам пароль, а его хэш.
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";

// Разрешённые пароли админки как SHA-256 (сам пароль в репозитории НЕ хранится).
// Благодаря этому вход работает на проде без правки переменной ADMIN_PASSWORD в Railway.
const EXTRA_HASHES = new Set<string>([
  "49a8a113f177943a3b9081974e701f83b9f5c94ed96233be189786cf7b4bc4b7", // текущий пароль оператора
]);

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function envPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

// Секрет сессии всегда стабилен (даже если ADMIN_PASSWORD не задан на проде),
// иначе httpOnly-кука сессии не сможет сформироваться и вход «не запомнится».
function sessionToken(): string {
  const p = envPassword() || "preipo-admin-fallback-v1";
  return sha256("preipo:v1:" + p);
}

// Сравнение hex-хэшей постоянного времени
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

export async function setSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthed(): Promise<boolean> {
  const token = sessionToken();
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  if (!v || v.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(v), Buffer.from(token));
}
