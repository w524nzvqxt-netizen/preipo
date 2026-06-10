"use client";

// Вход в кабинет партнёра: логин/пароль ИЛИ через Telegram (подтверждение в боте).
import { useActionState, useEffect, useRef, useState } from "react";
import { login, type LoginState, requestTgLogin, pollTgLogin } from "../actions";

const input =
  "w-full rounded-control border border-border bg-surface-alt px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none";

export default function AgentLoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [tg, setTg] = useState<{ code: string; link: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startTg() {
    const r = await requestTgLogin();
    setTg(r);
    window.open(r.link, "_blank");
  }

  useEffect(() => {
    if (!tg) return;
    timer.current = setInterval(async () => {
      const r = await pollTgLogin(tg.code);
      if (r.ok) {
        if (timer.current) clearInterval(timer.current);
        window.location.href = "/agent";
      }
    }, 2500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [tg]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-5 rounded-card border border-border bg-surface p-8">
        <div>
          <p className="kicker text-text-muted">Кабинет партнёра</p>
          <h1 className="mt-1 text-xl font-bold text-text-primary">Вход</h1>
        </div>

        <form action={action} className="space-y-3">
          <input name="username" placeholder="Логин" autoComplete="username" required className={input} />
          <input type="password" name="password" placeholder="Пароль" autoComplete="current-password" required className={input} />
          {state.error && <p className="text-sm text-negative">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-control bg-brand py-2.5 font-semibold text-bg transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Входим…" : "Войти"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-border" /> или <div className="h-px flex-1 bg-border" />
        </div>

        {!tg ? (
          <button
            onClick={startTg}
            className="w-full rounded-control border border-[#229ED9] bg-[#229ED9]/10 py-2.5 font-semibold text-[#229ED9] transition-colors hover:bg-[#229ED9]/20"
          >
            ✈️ Войти через Telegram
          </button>
        ) : (
          <div className="rounded-control border border-border bg-surface-alt p-4 text-center text-sm text-text-secondary">
            <p>Подтвердите вход в боте @preipoprobot.</p>
            <a href={tg.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-[#229ED9]">
              Открыть Telegram ↗
            </a>
            <p className="mt-2 text-xs text-text-muted">Жду подтверждения…</p>
          </div>
        )}
      </div>
    </main>
  );
}
