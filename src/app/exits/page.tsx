// Раздел «Уже на бирже»: компании, вышедшие на IPO — история раундов,
// цена акций, P/L, и калькулятор «что если бы вошли на раунде X».
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExitsExplorer, type ExitCompany } from "@/components/ExitsExplorer";
import { Disclaimer } from "@/components/Disclaimer";

export const revalidate = 300; // ISR: кэш 5 мин, быстрый TTFB, устойчивость к холодному старту

const TITLE = "Уже на бирже — история IPO | Pre-IPO Витрина";
const DESC = "Компании, вышедшие на IPO: история раундов с оценками, цена акций, доходность и калькулятор портфеля по точке входа.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/exits" },
  openGraph: { type: "website", title: TITLE, description: DESC, url: "/exits", siteName: "Pre-IPO Витрина", locale: "ru_RU" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

type RawRound = { round?: string; year?: number; valuationUSD?: number | null; note?: string; ours?: boolean };

export default async function ExitsPage() {
  const rows = await prisma.publicCompany.findMany({ orderBy: { order: "asc" } });

  const companies: ExitCompany[] = rows.map((r) => {
    let rounds: RawRound[] = [];
    try {
      rounds = JSON.parse(r.rounds ?? "[]") as RawRound[];
    } catch {
      rounds = [];
    }
    return {
      id: r.id,
      name: r.name,
      ticker: r.ticker,
      sector: r.sector,
      ipoDate: r.ipoDate,
      ipoPriceUSD: r.ipoPriceUSD,
      ipoValuationUSD: r.ipoValuationUSD,
      currentPriceUSD: r.currentPriceUSD,
      currentMarketCapUSD: r.currentMarketCapUSD,
      asOf: r.asOf,
      rounds: rounds.map((x) => ({
        round: x.round ?? "—",
        year: x.year ?? null,
        valuationUSD: x.valuationUSD ?? null,
        note: x.note ?? "",
        ours: x.ours ?? false,
      })),
    };
  });


  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <span className="text-brand">●</span> Pre-IPO Витрина
          </Link>
          <Link href="/#deals" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            ← К проектам
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <p className="kicker kicker-gold mb-2">Историческая выборка</p>
        <h1 className="text-display text-3xl font-bold sm:text-5xl">
          Уже на бирже: <span className="text-brand">от раунда до IPO</span>
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          {companies.length} компаний: путь pre-IPO → IPO. История раундов с оценками,
          цены на указанные даты и доходность с момента размещения — и взлёты, и
          провалы. Ниже — модель изменения цены с IPO без дивидендов, комиссий и налогов.
        </p>

        <p className="mt-6 rounded-card border border-border p-5 text-sm text-text-secondary">
          Частные раунды показывают оценку всей компании, а не доходность отдельной доли.
          Для расчёта результата инвестора нужны цена и класс акций, разводнение, комиссии
          и даты денежных потоков. Выборка компаний, дошедших до биржи, не представляет
          весь рынок pre-IPO и не является трек-рекордом нашего фонда.
        </p>

        <div className="mt-8">
          <ExitsExplorer companies={companies} />
        </div>
        <footer className="mt-16 border-t border-border pt-6">
          <Disclaimer />
        </footer>
      </main>
    </div>
  );
}
