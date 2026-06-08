// Управление бегущей строкой котировок
import { prisma } from "@/lib/prisma";
import { createQuote, updateQuote, deleteQuote } from "../../actions";

export const dynamic = "force-dynamic";

const input =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold">Котировки (бегущая строка)</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Индикативные оценки pre-IPO компаний для строки на главной.
      </p>

      {/* Добавить */}
      <form
        action={createQuote}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
      >
        <Field label="Компания">
          <input name="name" required placeholder="SpaceX" className={input} />
        </Field>
        <Field label="Оценка">
          <input name="valuation" placeholder="$350B" className={`${input} w-24`} />
        </Field>
        <Field label="Изменение">
          <input name="change" placeholder="+4,2%" className={`${input} w-24`} />
        </Field>
        <Field label="Порядок">
          <input name="order" type="number" defaultValue={quotes.length} className={`${input} w-20`} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="up" defaultChecked className="h-4 w-4 accent-emerald-500" />
          рост ▲
        </label>
        <input type="hidden" name="isActive" value="on" />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          + Добавить
        </button>
      </form>

      {/* Список */}
      <div className="mt-6 space-y-2">
        {quotes.map((q) => (
          <div
            key={q.id}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
          >
            <form
              action={updateQuote.bind(null, q.id)}
              className="flex flex-wrap items-end gap-3"
            >
              <input name="name" defaultValue={q.name} className={`${input} w-32`} />
              <input name="valuation" defaultValue={q.valuation} className={`${input} w-24`} />
              <input name="change" defaultValue={q.change} className={`${input} w-24`} />
              <input name="order" type="number" defaultValue={q.order} className={`${input} w-16`} />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="up" defaultChecked={q.up} className="h-4 w-4 accent-emerald-500" />▲
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={q.isActive} className="h-4 w-4 accent-emerald-500" />
                вкл
              </label>
              <button className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100">
                Сохранить
              </button>
            </form>
            <form action={deleteQuote}>
              <input type="hidden" name="id" value={q.id} />
              <button className="px-2 py-2 text-sm text-neutral-400 hover:text-red-500">
                Удалить
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
