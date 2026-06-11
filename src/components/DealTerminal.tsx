"use client";

// «Private deal terminal» на первом экране: не абстрактная картинка, а интерфейс
// доступа к сделкам. Спокойный private-markets тон, табличные данные, без хайпа.
// Значения, которые нельзя подтвердить публично, показываем аккуратно: «по запросу».
import { MagneticButton } from "@/components/motion/MagneticButton";

export type TerminalDeal = {
  name: string;
  sector: string;
  horizon: string;
  minTicket: string;
  status: string;
  liquidity: string;
  risk: string;
};

export function DealTerminal({ deals }: { deals: TerminalDeal[] }) {
  const primary = deals[0];
  const rest = deals.slice(1, 4);
  if (!primary) return null;

  return (
    <div className="glass inset-panel rounded-card p-1.5">
      <div className="rounded-[13px] p-5">
        {/* Шапка терминала */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="kicker nums text-text-muted">PRIVATE DEAL TERMINAL</span>
          <span className="flex items-center gap-1.5">
            <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-positive" />
            <span className="kicker text-text-muted">LIVE</span>
          </span>
        </div>

        {/* Основная сделка */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight text-text-primary">{primary.name}</h3>
            <span className="kicker rounded-pill border border-warning/40 bg-warning/10 px-2.5 py-1 text-warning">
              {primary.status}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-border bg-border">
            <Row label="Сектор" value={primary.sector} />
            <Row label="Горизонт" value={primary.horizon} />
            <Row label="Мин. чек" value={primary.minTicket} />
            <Row label="Ликвидность" value={primary.liquidity} />
            <Row label="Риск" value={primary.risk} accent="warning" />
            <Row label="Тип сделки" value="по запросу" />
          </dl>
          <MagneticButton
            href="#quiz"
            className="mt-4 block w-full rounded-control border border-brand/40 bg-brand-subtle py-2.5 text-center text-sm font-semibold text-brand transition-colors hover:border-brand/70"
          >
            Запросить условия
          </MagneticButton>
        </div>

        {/* Остальные компании — компактные строки */}
        {rest.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="kicker mb-2 text-text-muted">Также в доступе</p>
            <ul className="space-y-1.5">
              {rest.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-3 rounded-control px-1 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{d.name}</p>
                    <p className="truncate text-xs text-text-muted">{d.sector}</p>
                  </div>
                  <span className="kicker shrink-0 text-text-muted">{d.horizon}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "warning" }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="kicker text-text-muted">{label}</dt>
      <dd className={`nums mt-0.5 text-sm font-semibold ${accent === "warning" ? "text-warning" : "text-text-primary"}`}>
        {value}
      </dd>
    </div>
  );
}
