// Чистые расчёты кабинета партнёра (без prisma/next) — используются и сайтом,
// и Telegram-ботом, чтобы цифры считались одинаково.

export const SP500_ANNUAL = 0.1; // ~10%/год, долгосрочная средняя S&P 500

export type SaleLike = {
  amount: number;
  expMultiple: number | null;
  sf: number;
  entryFee: number;
  commission: number; // доля партнёра в SF (¼)
  yearsToExit: number | null;
  commissionPaid: boolean;
};

export function saleMetrics(s: SaleLike) {
  const mult = s.expMultiple ?? 1;
  const entry = s.entryFee ?? 0;
  const gross = s.amount * Math.max(0, mult - 1); // валовая прибыль клиента
  const exitValue = s.amount * mult;
  const clientNet = gross - (s.sf ?? 0) - entry; // чистая прибыль клиента
  const partnerTake = s.commission + entry; // заработок партнёра (вход + ¼SF)
  const years = s.yearsToExit ?? null;
  const rent = years && years > 0 && s.amount > 0 ? (partnerTake / s.amount / years) * 100 : null;
  return { mult, entry, gross, exitValue, clientNet, partnerTake, rent, sf: s.sf ?? 0, sfAgent: s.commission, years };
}

export function portfolio(sales: SaleLike[]) {
  const invested = sales.reduce((a, x) => a + x.amount, 0);
  const partnerTotal = sales.reduce((a, x) => a + x.commission + (x.entryFee ?? 0), 0);
  const partnerPaid = sales.filter((x) => x.commissionPaid).reduce((a, x) => a + x.commission + (x.entryFee ?? 0), 0);
  const clientProfit = sales.reduce((a, x) => a + saleMetrics(x).clientNet, 0);

  const wy = sales.filter((x) => x.yearsToExit && x.yearsToExit > 0);
  const yDenom = wy.reduce((a, x) => a + x.amount * (x.yearsToExit as number), 0);
  const partnerY = wy.reduce((a, x) => a + saleMetrics(x).partnerTake, 0);
  const clientNetY = wy.reduce((a, x) => a + saleMetrics(x).clientNet, 0);
  const preIpoY = wy.reduce((a, x) => a + saleMetrics(x).gross, 0);
  const spY = wy.reduce((a, x) => a + x.amount * (Math.pow(1 + SP500_ANNUAL, x.yearsToExit as number) - 1), 0);

  return {
    count: sales.length,
    invested,
    partnerTotal,
    partnerPaid,
    partnerUnpaid: partnerTotal - partnerPaid,
    clientProfit,
    agentAnnual: yDenom > 0 ? (partnerY / yDenom) * 100 : null,
    clientAnnual: yDenom > 0 ? (clientNetY / yDenom) * 100 : null,
    preIpoAnnual: yDenom > 0 ? (preIpoY / yDenom) * 100 : null,
    sp500Annual: yDenom > 0 ? (spY / yDenom) * 100 : null,
    clientTotal: invested > 0 ? (clientProfit / invested) * 100 : null,
    agentTotal: invested > 0 ? (partnerTotal / invested) * 100 : null,
  };
}
