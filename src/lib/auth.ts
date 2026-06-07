// Простая аутентификация админки через cookie.
// На MVP достаточно: один пароль из .env -> httpOnly cookie.
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

// Токен сессии = сам пароль (для MVP). Можно усложнить позже.
function sessionToken(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

// Проверка пароля при логине
export function checkPassword(password: string): boolean {
  return password === (process.env.ADMIN_PASSWORD || "admin123");
}

// Установить сессию (после успешного логина)
export async function setSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });
}

// Сбросить сессию (логаут)
export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Залогинен ли пользователь
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === sessionToken();
}
