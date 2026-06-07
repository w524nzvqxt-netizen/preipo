// Список заявок от посетителей
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { setLeadStatus, deleteLead } from "../../actions";

export const dynamic = "force-dynamic";

const STATUSES: Record<string, { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "В работе", cls: "bg-amber-100 text-amber-700" },
  done: { label: "Закрыта", cls: "bg-neutral-100 text-neutral-500" },
};

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Заявки</h1>
      <p className="text-sm text-neutral-400">Всего: {leads.length}</p>

      {leads.length === 0 ? (
        <p className="mt-10 text-neutral-500">Заявок пока нет.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{lead.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUSES[lead.status]?.cls ?? ""
                      }`}
                    >
                      {STATUSES[lead.status]?.label ?? lead.status}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-emerald-700">{lead.contact}</div>
                  {lead.project && (
                    <div className="mt-1 text-sm text-neutral-500">
                      Проект: {lead.project.name}
                    </div>
                  )}
                  {lead.message && (
                    <p className="mt-2 max-w-xl text-neutral-700">{lead.message}</p>
                  )}
                </div>
                <div className="text-right text-xs text-neutral-500">
                  {formatDate(lead.createdAt)}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-3">
                {Object.entries(STATUSES).map(([key, { label }]) => (
                  <form action={setLeadStatus} key={key}>
                    <input type="hidden" name="id" value={lead.id} />
                    <input type="hidden" name="status" value={key} />
                    <button
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        lead.status === key
                          ? "bg-neutral-900 text-white"
                          : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {label}
                    </button>
                  </form>
                ))}
                <form action={deleteLead} className="ml-auto">
                  <input type="hidden" name="id" value={lead.id} />
                  <button className="text-sm text-neutral-400 hover:text-red-500">
                    Удалить
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
