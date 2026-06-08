// Бегущая строка котировок популярных pre-IPO компаний.
// Частные компании не имеют биржевых котировок в реальном времени, поэтому
// здесь — индикативные оценки по открытым данным (последние известные раунды).
const ITEMS: { name: string; val: string; change: string; up: boolean }[] = [
  { name: "SpaceX", val: "$350B", change: "+4,2%", up: true },
  { name: "OpenAI", val: "$300B", change: "+6,1%", up: true },
  { name: "Anthropic", val: "$183B", change: "+3,4%", up: true },
  { name: "Stripe", val: "$70B", change: "+1,8%", up: true },
  { name: "Databricks", val: "$62B", change: "+2,5%", up: true },
  { name: "xAI", val: "$50B", change: "+5,0%", up: true },
  { name: "Revolut", val: "$45B", change: "+2,1%", up: true },
  { name: "Canva", val: "$32B", change: "+1,2%", up: true },
  { name: "Epic Games", val: "$32B", change: "−0,8%", up: false },
  { name: "Fanatics", val: "$31B", change: "+0,6%", up: true },
  { name: "Chime", val: "$25B", change: "−1,3%", up: false },
  { name: "Discord", val: "$15B", change: "+0,9%", up: true },
];

export function Ticker() {
  const row = [...ITEMS, ...ITEMS]; // дублируем для бесшовной прокрутки
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
            <span className="text-neutral-500">{it.val}</span>
            <span
              className={it.up ? "text-emerald-600" : "text-red-500"}
            >
              {it.up ? "▲" : "▼"} {it.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
