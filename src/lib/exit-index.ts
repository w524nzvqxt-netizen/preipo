// Индекс «$10 000 в каждый раунд»: гипотетически вкладываем $10k в каждый
// раунд привлечения каждой компании и сравниваем итог с S&P 500 за тот же период.

// Уровни S&P 500 по годам (приблизительно, на конец года) для точки входа.
const SP500: Record<number, number> = {
  2013: 1848, 2014: 2059, 2015: 2044, 2016: 2239, 2017: 2674, 2018: 2507,
  2019: 3231, 2020: 3756, 2021: 4766, 2022: 3840, 2023: 4770, 2024: 5882,
  2025: 6900, 2026: 7384,
};
const SP_NOW = 7384; // S&P 500 на июнь 2026
export const TICKET = 10_000; // $10k в каждый раунд

export type IndexInput = {
  currentMarketCapUSD: number | null;
  rounds: { valuationUSD: number | null; year: number | null }[];
};

export type IndexResult = {
  count: number;
  invested: number;
  preIpoValue: number;
  sp500Value: number;
  preIpoMult: number;
  sp500Mult: number;
};

export function computeExitIndex(companies: IndexInput[]): IndexResult {
  let count = 0;
  let preIpo = 0;
  let sp = 0;
  for (const c of companies) {
    if (!c.currentMarketCapUSD) continue;
    for (const r of c.rounds) {
      if (!r.valuationUSD) continue;
      count++;
      preIpo += TICKET * (c.currentMarketCapUSD / r.valuationUSD);
      const spYear = (r.year && SP500[r.year]) || SP_NOW;
      sp += TICKET * (SP_NOW / spYear);
    }
  }
  const invested = TICKET * count;
  return {
    count,
    invested,
    preIpoValue: preIpo,
    sp500Value: sp,
    preIpoMult: invested ? preIpo / invested : 0,
    sp500Mult: invested ? sp / invested : 0,
  };
}
