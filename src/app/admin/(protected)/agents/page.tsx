// Админ-раздел «Агенты»: все партнёры, их клиенты, сделки, файлы (обзор).
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAgents() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clients: true, sales: true, documents: true } },
      sales: { select: { amount: true, commission: true, entryFee: true, commissionPaid: true } },
    },
  });

  const totalInvested = agents.reduce((s, a) => s + a.sales.reduce((x, y) => x + y.amount, 0), 0);
  const totalClients = agents.reduce((s, a) => s + a._count.clients, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Агенты</h1>
          <p className="text-sm text-neutral-400">
            Всего агентов: {agents.length} · клиентов: {totalClients} · инвестировано: {formatPrice(totalInvested)}
          </p>
        </div>
      </div>

      {agents.length === 0 ? (
        <p className="mt-10 text-neutral-500">Агентов пока нет.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Агент</th>
                <th className="px-4 py-3">TG</th>
                <th className="px-4 py-3">Клиентов</th>
                <th className="px-4 py-3">Сделок</th>
                <th className="px-4 py-3">Инвестировано</th>
                <th className="px-4 py-3">Заработок партнёра</th>
                <th className="px-4 py-3">Файлов</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {agents.map((a) => {
                const invested = a.sales.reduce((s, x) => s + x.amount, 0);
                const partner = a.sales.reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
                return (
                  <tr key={a.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-neutral-500">@{a.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      {a.telegramId ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">привязан</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{a._count.clients}</td>
                    <td className="px-4 py-3">{a._count.sales}</td>
                    <td className="px-4 py-3">{formatPrice(invested)}</td>
                    <td className="px-4 py-3">{formatPrice(partner)}</td>
                    <td className="px-4 py-3">{a._count.documents}</td>
                    <td className="px-4 py-3">
                      {a.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Активен</span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">Отключён</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/agents/${a.id}`} className="font-medium text-neutral-600 hover:text-emerald-600">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
