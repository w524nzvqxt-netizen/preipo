// Раздел «Уже на бирже»: компании, вышедшие на IPO — история раундов,
// цена акций, P/L, и калькулятор «что если бы вошли на раунде X».
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExitsExplorer, type ExitCompany } from "@/components/ExitsExplorer";
import { Disclaimer } from "@/components/Disclaimer";
import { computeExitIndex, computeExitIndexSeries, TICKET } from "@/lib/exit-index";
import { IndexChart } from "@/components/IndexChart";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Уже на бирже — трек-рекорд IPO | Pre-IPO Витрина",
  description:
    "Компании, вышедшие на IPO: история раундов с оценками, цена акций, доходность и калькулятор портфеля по точке входа.",
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

  const idx = computeExitIndex(companies);
  const series = computeExitIndexSeries(companies);
  const outperform = idx.sp500Mult > 0 ? idx.preIpoMult / idx.sp500Mult : 0;

  return (
    <div className="island min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <span className="text-brand">●</span> Pre-IPO Витрина
          </Link>
          <Link href="/#projects" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            ← К проектам
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <p className="kicker mb-2 text-text-muted">Трек-рекорд рынка</p>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Уже на бирже: <span className="text-brand">от раунда до IPO</span>
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          20 компаний, прошедших путь pre-IPO → IPO. История раундов с оценками,
          цена акций сегодня и доходность с момента размещения — и взлёты, и
          провалы. Ниже — калькулятор: что было бы с вложением по точке входа.
        </p>

        {/* Индекс «$10k в каждый раунд» vs S&P 500 */}
        <div className="mt-8 overflow-hidden rounded-card border border-border bg-surface p-6 sm:p-8">
          <p className="kicker text-text-muted">
            Индекс · {formatMoney(TICKET)} в каждый из {idx.count} раундов
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="kicker text-text-muted">Вложено всего</p>
              <p className="nums mt-1 text-2xl font-bold text-text-primary">{formatMoney(idx.invested)}</p>
            </div>
            <div className="sm:border-l sm:border-border sm:pl-5">
              <p className="kicker text-text-muted">Pre-IPO портфель сегодня</p>
              <p className="nums mt-1 text-2xl font-bold text-positive">
                {formatMoney(idx.preIpoValue)}{" "}
                <span className="text-base">×{idx.preIpoMult.toFixed(1).replace(".", ",")}</span>
              </p>
            </div>
            <div className="sm:border-l sm:border-border sm:pl-5">
              <p className="kicker text-text-muted">Те же деньги в S&amp;P 500</p>
              <p className="nums mt-1 text-2xl font-bold text-text-secondary">
                {formatMoney(idx.sp500Value)}{" "}
                <span className="text-base">×{idx.sp500Mult.toFixed(1).replace(".", ",")}</span>
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Если бы {formatMoney(TICKET)} заходило в <b>каждый</b> раунд этих
            компаний (и взлёты, и провалы), портфель опередил бы S&amp;P 500
            примерно в{" "}
            <b className="text-brand">{outperform.toFixed(1).replace(".", ",")}×</b>.
            Сравнение модельное: каждая сумма входит по оценке раунда, S&amp;P 500
            — по уровню индекса того же года (тек. ≈ 7 384).
          </p>
          <div className="mt-6">
            <IndexChart series={series} />
          </div>
        </div>

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
