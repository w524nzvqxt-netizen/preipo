// График оценки компании по датам раундов (одна серия — сама компания).
// Server-SVG, без клиента. Две формы: spark (мини для карточки) и full (деталь).
// Тема из токенов сайта: линия — --color-brand (золото), подписи — текст-токены.
import { formatMoney } from "@/lib/format";

export type Round = { round?: string; date?: string; valuationUSD?: number };

// "YYYY-MM" | "YYYY" → числовое время (год + доля)
function tval(d?: string): number | null {
  if (!d) return null;
  const m = /(\d{4})(?:-(\d{2}))?/.exec(d);
  if (!m) return null;
  return +m[1] + (m[2] ? (+m[2] - 1) / 12 : 0);
}

type Pt = { t: number; v: number; round?: string; date?: string };
function clean(rounds: Round[]): Pt[] {
  const out: Pt[] = [];
  for (const r of rounds) {
    const t = tval(r.date);
    const v = r.valuationUSD;
    if (t != null && v != null && v > 0) out.push({ t, v, round: r.round, date: r.date });
  }
  return out.sort((a, b) => a.t - b.t);
}

export function ValuationSpark({ rounds }: { rounds: Round[] }) {
  const pts = clean(rounds);
  const W = 120, H = 34, pad = 3;
  if (pts.length < 2) return <div style={{ height: H }} />;
  const ts = pts.map((p) => p.t), vs = pts.map((p) => p.v);
  const t0 = Math.min(...ts), t1 = Math.max(...ts), v1 = Math.max(...vs);
  const x = (t: number) => pad + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - (v / (v1 || 1)) * (H - 2 * pad);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden style={{ display: "block", overflow: "visible" }}>
      <path d={d} fill="none" stroke="var(--color-brand)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
      <circle cx={x(last.t)} cy={y(last.v)} r={2.6} fill="var(--color-brand)" />
    </svg>
  );
}

export function ValuationChart({ rounds }: { rounds: Round[] }) {
  const pts = clean(rounds);
  if (pts.length === 0) return null;

  const W = 720, H = 280;
  const padL = 20, padR = 64, padT = 34, padB = 30;
  const ts = pts.map((p) => p.t), vs = pts.map((p) => p.v);
  const t0 = Math.min(...ts), t1 = Math.max(...ts);
  const vMax = Math.max(...vs) * 1.12;
  const x = (t: number) => padL + (pts.length === 1 ? 0.5 : (t - t0) / (t1 - t0 || 1)) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / vMax) * (H - padT - padB);

  // грид-линии без числовых подписей
  const grid = [0.33, 0.66, 1].map((f) => H - padB - f * (H - padT - padB));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts[pts.length - 1].t).toFixed(1)} ${H - padB} L${x(pts[0].t).toFixed(1)} ${H - padB} Z`;
  const yearFmt = (t: number) => String(Math.floor(t));

  // прореживание дат, чтобы подписи не наезжали
  const minGap = (W - padL - padR) / 6;
  const showDate: boolean[] = [];
  let lastLX = -1e9;
  pts.forEach((p, i) => {
    const px = x(p.t);
    const show = i === 0 || i === pts.length - 1 || px - lastLX > minGap;
    showDate.push(show);
    if (show) lastLX = px;
  });
  const last = pts[pts.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Оценка компании по раундам" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="valfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* грид без числовых подписей (шкалу и верхнее значение убрали) */}
      {grid.map((gy, i) => (
        <line key={i} x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="var(--color-border)" strokeWidth={1} opacity={0.4} />
      ))}

      {pts.length > 1 && <path d={area} fill="url(#valfill)" />}
      {pts.length > 1 && (
        <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {pts.map((p, i) => {
        const px = x(p.t), py = y(p.v);
        const isLast = i === pts.length - 1;
        const anchor = i === 0 ? "start" : isLast ? "end" : "middle";
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={isLast ? 5.5 : 4.5} fill="var(--color-bg)" stroke="var(--color-brand)" strokeWidth={2.5}>
              <title>{`${p.round || ""} · ${p.date || yearFmt(p.t)} · ${formatMoney(p.v, "USD")}`}</title>
            </circle>
            {showDate[i] && (
              <text x={px} y={H - padB + 18} textAnchor={anchor} fontSize={11} fill="var(--color-text-muted)">
                {p.date || yearFmt(p.t)}
              </text>
            )}
          </g>
        );
      })}

      {/* только последняя (текущая) оценка — крупно */}
      <text x={x(last.t)} y={y(last.v) - 14} textAnchor="end" fontSize={15} fontWeight={800} fill="var(--color-text-primary)">
        {formatMoney(last.v, "USD")}
      </text>
    </svg>
  );
}
