// Страница конструктора портфеля из открытых раундов.
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PortfolioBuilder, type Round } from "@/components/PortfolioBuilder";
import { Disclaimer } from "@/components/Disclaimer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Конструктор портфеля — Pre-IPO Витрина",
  description:
    "Соберите портфель из открытых pre-IPO раундов и оцените результат по трём сценариям с дорожной картой IPO.",
};

// Достаёт множители худший/базовый/лучший из JSON сценариев проекта
function mults(scenariosJson: string | null) {
  try {
    const arr = JSON.parse(scenariosJson ?? "[]") as {
      color?: string;
      mult?: number;
    }[];
    const pick = (color: string) =>
      arr.find((s) => s.color === color)?.mult ?? null;
    return {
      worst: pick("amber") ?? 1,
      base: pick("sky") ?? 1,
      best: pick("emerald") ?? 1,
    };
  } catch {
    return { worst: 1, base: 1, best: 1 };
  }
}

export default async function PortfolioPage() {
  const deals = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: [{ dealStatus: "asc" }, { valuation: "desc" }],
  });

  const rounds: Round[] = deals
    .filter((p) => p.scenarios)
    .map((p) => {
      const m = mults(p.scenarios);
      return {
        id: p.id,
        name: p.name,
        sector: p.sector,
        valuation: p.valuation,
        currency: p.currency,
        expectedExit: p.expectedExit,
        expectedReturn: p.expectedReturn,
        illustrative: false,
        worst: m.worst,
        base: m.base,
        best: m.best,
      };
    });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-text-primary"
          >
            <span className="text-brand">●</span> Pre-IPO Витрина
          </Link>
          <Link
            href="/#projects"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            ← К проектам
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <p className="kicker mb-2 text-text-muted">Конструктор</p>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Соберите <span className="text-brand">портфель</span> из pre-IPO раундов
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Выберите открытые раунды и распределите суммы — получите результат
          портфеля по трём сценариям (худший / базовый / лучший) и дорожную карту
          выходов на IPO.
        </p>

        {rounds.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-border p-10 text-center text-text-muted">
            Пока нет открытых раундов для портфеля.
          </div>
        ) : (
          <div className="mt-8">
            <PortfolioBuilder rounds={rounds} />
          </div>
        )}

        <footer className="mt-16 border-t border-border pt-6">
          <Disclaimer />
        </footer>
      </main>
    </div>
  );
}
