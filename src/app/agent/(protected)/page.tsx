// Дашборд агента: сводка (продано, комиссии выплачено/к выплате) + список клиентов.
import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { addClient } from "../actions";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-control border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none";

export default async function AgentDashboard() {
  const agent = await requireAgent();

  const clients = await prisma.client.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    include: { sales: true, _count: { select: { documents: true } } },
  });

  const sales = await prisma.sale.findMany({ where: { agentId: agent.id } });
  const totalSold = sales.reduce((s, x) => s + x.amount, 0);
  // заработок партнёра = вход 5% + ¼ SF
  const totalComm = sales.reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
  const totalSfAgent = sales.reduce((s, x) => s + x.commission, 0); // доля агента в SF (¼)
  const clientProfit = sales.reduce(
    (s, x) => s + (x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) - (x.sf ?? 0) - (x.entryFee ?? 0)),
    0
  );
  const paidComm = sales
    .filter((x) => x.commissionPaid)
    .reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
  const unpaidComm = totalComm - paidComm;
  // рентабельность агента: Σ комиссий ÷ Σ(инвестиция × годы до выхода)
  const yDenom = sales.reduce((s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * x.yearsToExit : 0), 0);
  const yNum = sales.reduce((s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.commission + (x.entryFee ?? 0) : 0), 0);
  const agentYield = yDenom > 0 ? (yNum / yDenom) * 100 : null;

  // Доходность портфеля: среднегодовая (взвеш. по сумме×годы) и всего (за горизонт)
  const clientProfitY = sales.reduce(
    (s, x) =>
      s + (x.yearsToExit && x.yearsToExit > 0
        ? x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) - (x.sf ?? 0) - (x.entryFee ?? 0)
        : 0),
    0
  );
  const clientAnnual = yDenom > 0 ? (clientProfitY / yDenom) * 100 : null; // %/год
  const clientTotal = totalSold > 0 ? (clientProfit / totalSold) * 100 : null; // % всего
  const agentAnnual = agentYield; // %/год (= yNum / yDenom)
  const agentTotal = totalSold > 0 ? (totalComm / totalSold) * 100 : null; // % всего

  // Сравнение валовой доходности pre-IPO и S&P 500 за тот же горизонт (без комиссий)
  const SP500_ANNUAL = 0.1; // ~10%/год, долгосрочная средняя S&P 500
  const preIpoGrossY = sales.reduce(
    (s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) : 0),
    0
  );
  const sp500GrossY = sales.reduce((s, x) => {
    const y = x.yearsToExit ?? 0;
    return y > 0 ? s + x.amount * (Math.pow(1 + SP500_ANNUAL, y) - 1) : s;
  }, 0);
  const preIpoAnnual = yDenom > 0 ? (preIpoGrossY / yDenom) * 100 : null;
  const sp500Annual = yDenom > 0 ? (sp500GrossY / yDenom) * 100 : null;

  const pct = (v: number | null) => (v != null ? `${v.toFixed(1).replace(".", ",")}%` : "—");
  const ppm = (a: number | null, b: number | null) =>
    a != null && b != null ? `${a - b >= 0 ? "+" : ""}${(a - b).toFixed(1).replace(".", ",")} п.п.` : "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker text-text-muted">Сводка</p>
          <h1 className="mt-1 text-2xl font-bold text-text-primary">Мои продажи</h1>
        </div>
        <Link
          href="/agent/report"
          className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
        >
          📄 Отчёт по портфелю
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border lg:grid-cols-3">
        <Kpi label="Клиентов" value={String(clients.length)} />
        <Kpi label="Инвестировано" value={formatPrice(totalSold)} accent />
        <Kpi label="Заработок клиентов" value={formatPrice(clientProfit)} />
        <Kpi label="SF агента" value={formatPrice(totalSfAgent)} />
        <Kpi label="Заработок партнёра" value={formatPrice(totalComm)} accent />
        <Kpi label="К выплате" value={formatPrice(unpaidComm)} warn={unpaidComm > 0} />
      </div>

      {/* Доходность портфеля */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="kicker text-text-muted">Чистая доходность клиента · портфель</p>
          <p className="nums mt-2 text-3xl font-bold text-positive">
            {clientAnnual != null ? `${clientAnnual.toFixed(1).replace(".", ",")}%/год` : "—"}
          </p>
          <p className="nums mt-1 text-sm text-text-muted">{pct(clientTotal)} за весь горизонт</p>
          <p className="nums mt-2 text-sm text-text-secondary">
            Pre-IPO <span className="text-positive">{preIpoAnnual != null ? `${preIpoAnnual.toFixed(1).replace(".", ",")}%/год` : "—"}</span>
            {" vs "}S&amp;P 500 <span className="text-text-muted">{sp500Annual != null ? `${sp500Annual.toFixed(1).replace(".", ",")}%/год` : "—"}</span>
            {preIpoAnnual != null && sp500Annual != null ? <span className="ml-1 text-positive">{ppm(preIpoAnnual, sp500Annual)}</span> : null}
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="kicker text-text-muted">Рентабельность портфеля агента</p>
          <p className="nums mt-2 text-3xl font-bold text-brand">
            {agentAnnual != null ? `${agentAnnual.toFixed(1).replace(".", ",")}%/год` : "—"}
          </p>
          <p className="nums mt-1 text-sm text-text-muted">{pct(agentTotal)} за весь горизонт</p>
        </div>
      </div>

      {/* Добавить клиента */}
      <form action={addClient} className="rounded-card border border-border bg-surface p-5">
        <p className="kicker mb-3 text-text-muted">Новый клиент</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="name" placeholder="Имя клиента *" required className={input} />
          <input name="contact" placeholder="Телефон / email / @tg" className={input} />
          <input name="notes" placeholder="Заметка" className={input} />
        </div>
        <button className="mt-3 rounded-control bg-brand px-5 py-2 text-sm font-semibold text-bg transition-all hover:brightness-110">
          Добавить клиента
        </button>
      </form>

      {/* Клиенты */}
      <div>
        <p className="kicker mb-3 text-text-muted">Клиенты ({clients.length})</p>
        {clients.length === 0 ? (
          <div className="rounded-card border border-dashed border-border p-8 text-center text-text-muted">
            Пока нет клиентов. Добавьте первого выше.
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => {
              const sold = c.sales.reduce((s, x) => s + x.amount, 0);
              const comm = c.sales.reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
              const cprofit = c.sales.reduce(
                (s, x) => s + (x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) - (x.sf ?? 0) - (x.entryFee ?? 0)),
                0
              );
              return (
                <Link
                  key={c.id}
                  href={`/agent/clients/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-brand"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{c.name}</p>
                    <p className="text-sm text-text-muted">
                      {c.contact || "—"} · {c.sales.length} сделок · {c._count.documents} документов
                    </p>
                  </div>
                  <div className="flex gap-5 text-right">
                    <div>
                      <p className="kicker text-text-muted">Инвестир.</p>
                      <p className="nums font-semibold text-text-primary">{formatPrice(sold)}</p>
                    </div>
                    <div>
                      <p className="kicker text-text-muted">Клиент</p>
                      <p className="nums font-semibold text-positive">{formatPrice(cprofit)}</p>
                    </div>
                    <div>
                      <p className="kicker text-text-muted">Партнёр</p>
                      <p className="nums font-semibold text-brand">{formatPrice(comm)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-surface p-4">
      <p className="kicker text-text-muted">{label}</p>
      <p className={`nums mt-1 text-xl font-bold ${warn ? "text-warning" : accent ? "text-brand" : "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
