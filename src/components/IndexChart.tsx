// График индекса «$10k в каждый раунд» vs S&P 500.
// Лог-шкала по Y (большой разброс значений), без сторонних библиотек.
import type { IndexPoint } from "@/lib/exit-index";

function fmt(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}k`;
  return `$${Math.round(v)}`;
}

export function IndexChart({ series }: { series: IndexPoint[] }) {
  if (series.length < 2) return null;

  const W = 720, H = 340;
  const padL = 52, padR = 96, padT = 16, padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const years = series.map((p) => p.year);
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const allVals = series.flatMap((p) => [p.preIpo, p.sp500]);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const lminV = Math.log10(minV);
  const lmaxV = Math.log10(maxV);

  const x = (yr: number) =>
    padL + ((yr - minYear) / Math.max(1, maxYear - minYear)) * plotW;
  const y = (v: number) =>
    padT + plotH - ((Math.log10(v) - lminV) / (lmaxV - lminV)) * plotH;

  const line = (key: "preIpo" | "sp500") =>
    series.map((p) => `${x(p.year).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

  // горизонтальные линии сетки по степеням 10
  const gridVals: number[] = [];
  for (let e = Math.ceil(lminV); e <= Math.floor(lmaxV); e++) gridVals.push(10 ** e);

  const last = series[series.length - 1];

  return (
    <figure className="overflow-hidden rounded-card border border-border bg-surface p-4 sm:p-6">
      <figcaption className="kicker mb-3 text-text-muted">
        Накопленная стоимость сегодня по году входа · лог-шкала
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="График индекса pre-IPO против S&P 500">
        {/* сетка + подписи Y */}
        {gridVals.map((gv) => (
          <g key={gv}>
            <line x1={padL} x2={W - padR} y1={y(gv)} y2={y(gv)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={padL - 8} y={y(gv) + 4} textAnchor="end" fontSize="16" fill="var(--color-text-muted)">
              {fmt(gv)}
            </text>
          </g>
        ))}
        {/* подписи X (годы) */}
        {series.filter((_, i) => i % 2 === 0 || i === series.length - 1).map((p) => (
          <text key={p.year} x={x(p.year)} y={H - 12} textAnchor="middle" fontSize="16" fill="var(--color-text-muted)">
            {p.year}
          </text>
        ))}
        {/* линия S&P 500 */}
        <polyline points={line("sp500")} fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeDasharray="5 4" />
        {/* линия Pre-IPO */}
        <polyline points={line("preIpo")} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" />
        {/* точки на конце + подписи */}
        <circle cx={x(last.year)} cy={y(last.preIpo)} r="3.5" fill="var(--color-brand)" />
        <text x={x(last.year) + 8} y={y(last.preIpo) + 4} fontSize="16" fontWeight="700" fill="var(--color-positive)">
          {fmt(last.preIpo)}
        </text>
        <circle cx={x(last.year)} cy={y(last.sp500)} r="3.5" fill="var(--color-text-muted)" />
        <text x={x(last.year) + 8} y={y(last.sp500) + 4} fontSize="16" fontWeight="700" fill="var(--color-text-secondary)">
          {fmt(last.sp500)}
        </text>
      </svg>
      {/* легенда */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="flex items-center gap-2 text-text-secondary">
          <span className="inline-block h-0.5 w-5 bg-brand" /> Pre-IPO раунды
        </span>
        <span className="flex items-center gap-2 text-text-secondary">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-text-muted" /> S&amp;P 500
        </span>
      </div>
    </figure>
  );
}
