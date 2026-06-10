// Отчёт инвестора по клиенту — печатный «документ» (Печать → PDF).
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";
import { portfolio, saleMetrics } from "@/lib/agent-calc";
import { PrintButton } from "@/components/agent/PrintButton";

export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v != null ? `${v.toFixed(1).replace(".", ",")}%/год` : "—");

export default async function ClientReport({ params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent();
  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, agentId: agent.id },
    include: { sales: { orderBy: { soldAt: "desc" } } },
  });
  if (!client) notFound();
  const p = portfolio(client.sales);

  return (
    <div className="mx-auto max-w-3xl rounded-card bg-white p-8 text-neutral-900 shadow-sm print:rounded-none print:p-0 print:shadow-none">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/agent/clients/${id}`} className="text-sm text-neutral-500 hover:text-neutral-900">← К клиенту</Link>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between border-b border-neutral-200 pb-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">◆ Pre-IPO</p>
          <h1 className="mt-1 text-2xl font-bold">Отчёт инвестора</h1>
          <p className="mt-1 text-neutral-600">{client.name}{client.contact ? ` · ${client.contact}` : ""}</p>
        </div>
        <p className="text-sm text-neutral-500">{formatDate(new Date())}</p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Box label="Инвестировано" value={formatPrice(p.invested)} />
        <Box label="Чистая прибыль (прогноз)" value={formatPrice(p.clientProfit)} accent />
        <Box label="Доходность" value={pct(p.clientAnnual)} accent />
        <Box label="S&P 500" value={pct(p.sp500Annual)} />
      </section>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left text-neutral-500">
            <th className="py-2 font-medium">Компания</th>
            <th className="py-2 font-medium">Раунд</th>
            <th className="py-2 font-medium">Сумма</th>
            <th className="py-2 font-medium">Прогноз ×</th>
            <th className="py-2 font-medium">Прогноз стоимости</th>
            <th className="py-2 font-medium">Чистая прибыль</th>
            <th className="py-2 font-medium">Горизонт</th>
          </tr>
        </thead>
        <tbody>
          {client.sales.map((s) => {
            const m = saleMetrics(s);
            return (
              <tr key={s.id} className="border-b border-neutral-200">
                <td className="py-2 font-medium">{s.companyName}</td>
                <td className="py-2 text-neutral-600">{s.round ?? "—"}</td>
                <td className="py-2 tabular-nums">{formatPrice(s.amount, s.currency)}</td>
                <td className="py-2 tabular-nums">{m.mult.toFixed(2).replace(".", ",")}×</td>
                <td className="py-2 tabular-nums">{formatPrice(m.exitValue, s.currency)}</td>
                <td className="py-2 tabular-nums text-emerald-700">{formatPrice(m.clientNet, s.currency)}</td>
                <td className="py-2 tabular-nums text-neutral-600">{s.yearsToExit ? `~${String(s.yearsToExit).replace(".", ",")} лет` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        Прогноз основан на ожидаемой оценке выхода компаний и не является гарантией.
        Доходность указана за вычетом комиссии за вход (5%) и комиссии за успех (20% прибыли).
        Сравнение с S&P 500 — при среднегодовой доходности индекса ~10%. Не является
        индивидуальной инвестиционной рекомендацией.
      </p>
    </div>
  );
}

function Box({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent ? "text-emerald-700" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}
