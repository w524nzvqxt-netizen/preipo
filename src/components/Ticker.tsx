// Бегущая строка котировок популярных pre-IPO компаний.
// Данные управляются из админки (модель Quote). Индикативные оценки —
// у частных компаний нет биржевых котировок в реальном времени.
import { prisma } from "@/lib/prisma";

export async function Ticker() {
  const quotes = await prisma.quote.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  if (quotes.length === 0) return null;

  const row = [...quotes, ...quotes]; // дублируем для бесшовной прокрутки
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white/70 py-2 backdrop-blur">
      <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center gap-2 bg-white/90 px-3 text-xs font-semibold uppercase tracking-wider text-emerald-600 backdrop-blur">
        Pre-IPO
        <span className="hidden font-normal normal-case tracking-normal text-neutral-400 sm:inline">
          · индикативно
        </span>
      </div>
      <div className="marquee flex w-max gap-8 whitespace-nowrap pl-28">
        {row.map((it, i) => (
          <span key={i} className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-neutral-900">{it.name}</span>
            <span className="text-neutral-500">{it.valuation}</span>
            {it.change && (
              <span className={it.up ? "text-emerald-600" : "text-red-500"}>
                {it.up ? "▲" : "▼"} {it.change}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
