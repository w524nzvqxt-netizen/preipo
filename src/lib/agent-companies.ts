// Список компаний для формы сделки: публичные («Уже на бирже») с раундами +
// проекты витрины. Цена акции на раунде = оценка_раунда × текущая_цена ÷ текущая_капитализация.
// Год выхода (IPO) отдаём, а срок удержания считаем в форме как «год выхода − год раунда + лок-ап».
import { prisma } from "@/lib/prisma";

export type RoundOption = {
  round: string;
  year: number | null;
  valuationUSD: number | null;
  sharePrice: number | null;
};
export type CompanyOption = {
  name: string;
  marketCap: number | null;
  rounds: RoundOption[];
  exitLabel: string | null; // напр. "IPO 2028"
  exitYear: number | null; // десятичный год выхода (IPO)
};

// Десятичный год выхода из строки даты IPO ("2028-07") или прогноза ("H2 2029").
function exitDecimal(s: string | null | undefined): { dec: number; year: number } | null {
  if (!s) return null;
  const ym = s.match(/(\d{4})-(\d{2})/);
  if (ym) return { dec: +ym[1] + (+ym[2] - 1) / 12, year: +ym[1] };
  const y = s.match(/(\d{4})/);
  if (!y) return null;
  const year = +y[1];
  let month = 6;
  if (/H2|2H|3Q|4Q|Q3|Q4/i.test(s)) month = 9;
  else if (/H1|1H|1Q|2Q|Q1|Q2/i.test(s)) month = 3;
  return { dec: year + (month - 1) / 12, year };
}

export async function getCompanyOptions(): Promise<CompanyOption[]> {
  const [projects, publicCos] = await Promise.all([
    prisma.project.findMany({
      where: { isActive: true },
      select: { name: true, stage: true, valuation: true, exitValuation: true, pricePerShare: true, expectedExit: true },
      orderBy: { name: "asc" },
    }),
    prisma.publicCompany.findMany({ orderBy: { currentMarketCapUSD: "desc" } }),
  ]);

  const parseRounds = (s: string | null) => {
    try {
      return (JSON.parse(s ?? "[]") as { round?: string; year?: number | null; valuationUSD?: number | null }[])
        .filter((r) => r && (r.valuationUSD ?? 0) > 0);
    } catch {
      return [];
    }
  };

  const seen = new Set<string>();
  const out: CompanyOption[] = [];
  for (const pc of publicCos) {
    seen.add(pc.name);
    const cap = pc.currentMarketCapUSD ?? null;
    const cur = pc.currentPriceUSD ?? null;
    const ex = exitDecimal(pc.ipoDate);
    out.push({
      name: pc.name,
      marketCap: cap,
      exitLabel: ex ? `IPO ${ex.year}` : null,
      exitYear: ex ? ex.dec : null,
      rounds: parseRounds(pc.rounds).map((r) => ({
        round: r.round ?? "Раунд",
        year: r.year ?? null,
        valuationUSD: r.valuationUSD ?? null,
        sharePrice: r.valuationUSD && cur && cap ? (r.valuationUSD * cur) / cap : null,
      })),
    });
  }
  for (const p of projects) {
    if (seen.has(p.name)) continue;
    const ex = exitDecimal(p.expectedExit);
    out.push({
      name: p.name,
      marketCap: p.exitValuation ?? null,
      exitLabel: ex ? `IPO ${ex.year}` : null,
      exitYear: ex ? ex.dec : null,
      rounds: p.valuation
        ? [{ round: p.stage || "Вход", year: null, valuationUSD: p.valuation, sharePrice: p.pricePerShare ?? null }]
        : [],
    });
  }
  return out;
}
