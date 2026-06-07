// Дашборд админки: список проектов с управлением
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatPrice } from "@/lib/format";
import { toggleActive, deleteProject } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [projects, newLeads] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true } } },
    }),
    prisma.lead.count({ where: { status: "new" } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Проекты</h1>
          <p className="text-sm text-neutral-400">
            Всего: {projects.length} · Новых заявок:{" "}
            <Link href="/admin/leads" className="font-semibold text-emerald-600">
              {newLeads}
            </Link>
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
        >
          + Новый проект
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-10 text-neutral-500">
          Проектов пока нет. Создайте первый.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3">Проект</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Объём</th>
                <th className="px-4 py-3">Заявки</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {p.name} {p.isHot && "🔥"}
                    </div>
                    <div className="text-neutral-500">
                      {[p.sector, p.stage].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(p.pricePerShare, p.currency)}
                  </td>
                  <td className="px-4 py-3">{formatMoney(p.volume, p.currency)}</td>
                  <td className="px-4 py-3">{p._count.leads}</td>
                  <td className="px-4 py-3">
                    <form action={toggleActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {p.isActive ? "Активен" : "Скрыт"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="text-neutral-600 hover:text-emerald-600"
                      >
                        Изменить
                      </Link>
                      <form action={deleteProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-neutral-400 hover:text-red-500">
                          Удалить
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
