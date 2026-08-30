// Админ: детали агента — его клиенты, сделки и файлы (со скачиванием).
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSize, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAgentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      clients: {
        orderBy: { createdAt: "desc" },
        include: { sales: { orderBy: { soldAt: "desc" } }, documents: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!agent) notFound();

  const invested = agent.clients.reduce((s, c) => s + c.sales.reduce((x, y) => x + y.amount, 0), 0);
  const partner = agent.clients.reduce((s, c) => s + c.sales.reduce((x, y) => x + y.commission + (y.entryFee ?? 0), 0), 0);

  return (
    <div>
      <Link href="/admin/agents" className="text-sm text-neutral-500 hover:text-neutral-900">← Все агенты</Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-sm text-neutral-500">
            @{agent.username} · {agent.telegramId ? "TG привязан" : "TG не привязан"} · {agent.isActive ? "активен" : "отключён"}
          </p>
        </div>
        <div className="text-right text-sm text-neutral-500">
          Клиентов: {agent.clients.length} · Инвестировано: <b className="text-neutral-800">{formatPrice(invested)}</b> · Заработок партнёра: <b className="text-neutral-800">{formatPrice(partner)}</b>
        </div>
      </div>

      {agent.clients.length === 0 ? (
        <p className="mt-10 text-neutral-500">У агента нет клиентов.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {agent.clients.map((c) => {
            const sold = c.sales.reduce((s, x) => s + x.amount, 0);
            return (
              <div key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-neutral-500">{c.contact || "—"}{c.notes ? ` · ${c.notes}` : ""}</p>
                  </div>
                  <p className="text-sm text-neutral-500">Инвестировано: <b className="text-neutral-800">{formatPrice(sold)}</b></p>
                </div>

                {c.sales.length > 0 && (
                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">Сделки</p>
                    <ul className="space-y-1 text-sm">
                      {c.sales.map((s) => (
                        <li key={s.id} className="text-neutral-700">
                          {s.companyName}{s.round ? ` (${s.round})` : ""} — {formatPrice(s.amount, s.currency)}
                          {s.expMultiple ? ` · ×${s.expMultiple.toFixed(2)}` : ""} · заработок партнёра {formatPrice(s.commission + (s.entryFee ?? 0), s.currency)}
                          {s.commissionPaid ? " · выплачено" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.documents.length > 0 && (
                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">Файлы</p>
                    <ul className="space-y-1 text-sm">
                      {c.documents.map((d) => (
                        <li key={d.id}>
                          <a
                            href={`/admin/files/${d.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline"
                          >
                            {d.title || d.fileName}
                          </a>
                          <span className="text-neutral-400"> · {d.fileName} · {formatSize(d.sizeBytes)} · {formatDate(d.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
