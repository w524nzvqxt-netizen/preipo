"use client";

// Страница входа в админку
import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={action}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold">Вход в админку</h1>
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          required
          autoFocus
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 outline-none focus:border-emerald-500"
        />
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
