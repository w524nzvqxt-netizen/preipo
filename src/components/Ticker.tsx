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
    <div className="relative overflow-hidden rounded-control border border-border bg-surface py-2">
      <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center gap-2 bg-surface px-3">
        <span className="kicker text-text-muted">Pre-IPO</span>
        <span className="hidden text-xs font-normal text-text-muted sm:inline">
          · индикативно
        </span>
      </div>
      <div className="marquee flex w-max gap-8 whitespace-nowrap pl-28">
        {row.map((it, i) => (
          <span key={i} className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-text-primary">{it.name}</span>
            <span className="nums text-text-secondary">{it.valuation}</span>
            {it.change && (
              <span className={`nums ${it.up ? "text-positive" : "text-negative"}`}>
                {it.up ? "▲" : "▼"} {it.change}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
