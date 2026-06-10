// Защищённый layout кабинета агента: проверка сессии + шапка. noindex.
import type { Metadata } from "next";
import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: "Кабинет партнёра",
  robots: { index: false, follow: false },
};

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireAgent();
  return (
    <div className="min-h-screen bg-bg print:bg-white">
      <nav className="full-bleed border-b border-border bg-surface/60 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/agent" className="font-bold text-text-primary">Кабинет партнёра</Link>
            <span className="hidden text-sm text-text-muted sm:inline">· {agent.name}</span>
          </div>
          <form action={logout}>
            <button className="text-sm font-medium text-text-muted transition-colors hover:text-negative">
              Выйти
            </button>
          </form>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
