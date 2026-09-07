// Страница конструктора портфеля из открытых раундов.
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PortfolioBuilder, type Round } from "@/components/PortfolioBuilder";
import { parseScenarios } from "@/lib/scenarios";
import { Disclaimer } from "@/components/Disclaimer";

export const revalidate = 300; // ISR: кэш 5 мин, быстрый TTFB, устойчивость к холодному старту

const TITLE = "Конструктор портфеля — Pre-IPO Витрина";
const DESC = "Соберите портфель из открытых pre-IPO раундов и оцените результат по трём сценариям с дорожной картой IPO.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/portfolio" },
  openGraph: { type: "website", title: TITLE, description: DESC, url: "/portfolio", siteName: "Pre-IPO Витрина", locale: "ru_RU" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default async function PortfolioPage() {
  const deals = await prisma.project.findMany({
    where: { isActive: true, dealStatus: "open", currency: "USD" },
    orderBy: [{ dealStatus: "asc" }, { valuation: "desc" }],
  });

  const rounds: Round[] = deals
    .filter((p) => parseScenarios(p.scenarios) !== null)
    .map((p) => {
      const rows = parseScenarios(p.scenarios)!;
      const m = { worst: rows[0].mult, base: rows[1].mult, best: rows[2].mult };
      return {
        id: p.id,
        name: p.name,
        sector: p.sector,
        valuation: p.valuation,
        currency: p.currency,
        expectedExit: p.expectedExit,
        expectedReturn: null,
        illustrative: true,
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
            href="/#deals"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            ← К проектам
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <p className="kicker kicker-gold mb-2">Конструктор</p>
        <h1 className="text-display text-3xl font-bold sm:text-5xl">
          Соберите <span className="text-brand">портфель</span> из pre-IPO раундов
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Выберите открытые сделки в USD с доступной моделью и распределите суммы — получите результат
          портфеля по трём сценариям (пессимистичный / базовый / оптимистичный) и дорожную карту
          выходов на IPO.
        </p>

        {rounds.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-border p-10 text-center text-text-muted">
            Пока нет открытых сделок в USD с проверенной структурой сценариев.
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
