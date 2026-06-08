// Аутентификация админки через httpOnly-cookie.
// В куке лежит НЕ сам пароль, а его хэш. Без заданного ADMIN_PASSWORD вход закрыт.
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// Токен сессии — хэш пароля с солью (в куку не попадает сам пароль)
function sessionToken(): string | null {
  const p = adminPassword();
  if (!p) return null;
  return sha256("preipo:v1:" + p);
}

// Сравнение пароля постоянного времени
export function checkPassword(password: string): boolean {
  const p = adminPassword();
  if (!p) return false; // без заданного пароля вход невозможен (fail-closed)
  const a = Buffer.from(sha256(password), "hex");
  const b = Buffer.from(sha256(p), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSession() {
  const token = sessionToken();
  if (!token) return;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
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
  if (!token) return false;
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  if (!v || v.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(v), Buffer.from(token));
}
