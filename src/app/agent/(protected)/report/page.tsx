// Отчёт партнёра по всем клиентам — печатный «документ» (Печать → PDF).
import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";
import { portfolio } from "@/lib/agent-calc";
import { PrintButton } from "@/components/agent/PrintButton";

export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v != null ? `${v.toFixed(1).replace(".", ",")}%/год` : "—");

export default async function PartnerReport() {
  const agent = await requireAgent();
  const clients = await prisma.client.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    include: { sales: true },
  });
  const all = clients.flatMap((c) => c.sales);
  const p = portfolio(all);

  return (
    <div className="mx-auto max-w-3xl rounded-card bg-white p-8 text-neutral-900 shadow-sm print:rounded-none print:p-0 print:shadow-none">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/agent" className="text-sm text-neutral-500 hover:text-neutral-900">← На дашборд</Link>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between border-b border-neutral-200 pb-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">◆ Pre-IPO</p>
          <h1 className="mt-1 text-2xl font-bold">Отчёт партнёра</h1>
          <p className="mt-1 text-neutral-600">{agent.name}</p>
        </div>
        <p className="text-sm text-neutral-500">{formatDate(new Date())}</p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Box label="Клиентов" value={String(clients.length)} />
        <Box label="Инвестировано" value={formatPrice(p.invested)} />
        <Box label="Заработок партнёра" value={formatPrice(p.partnerTotal)} accent />
        <Box label="Рентабельность" value={pct(p.agentAnnual)} accent />
      </section>
      <p className="mt-2 text-sm text-neutral-600">
        Выплачено {formatPrice(p.partnerPaid)} · к выплате {formatPrice(p.partnerUnpaid)} ·
        чистая доходность клиентов {pct(p.clientAnnual)} (S&P 500 {pct(p.sp500Annual)})
      </p>

      <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm print:min-w-0">
        <thead>
          <tr className="border-b border-neutral-300 text-left text-neutral-500">
            <th className="py-2 font-medium">Клиент</th>
            <th className="py-2 font-medium">Сделок</th>
            <th className="py-2 font-medium">Инвестировано</th>
            <th className="py-2 font-medium">Прибыль клиента</th>
            <th className="py-2 font-medium">Заработок партнёра</th>
            <th className="py-2 font-medium">Рентаб.</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const cp = portfolio(c.sales);
            return (
              <tr key={c.id} className="border-b border-neutral-200">
                <td className="py-2 font-medium">{c.name}</td>
                <td className="py-2 tabular-nums text-neutral-600">{c.sales.length}</td>
                <td className="py-2 tabular-nums">{formatPrice(cp.invested)}</td>
                <td className="py-2 tabular-nums text-emerald-700">{formatPrice(cp.clientProfit)}</td>
                <td className="py-2 tabular-nums">{formatPrice(cp.partnerTotal)}</td>
                <td className="py-2 tabular-nums">{pct(cp.agentAnnual)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        Прогнозные значения основаны на ожидаемой оценке выхода компаний и не являются гарантией.
        Не является индивидуальной инвестиционной рекомендацией.
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
