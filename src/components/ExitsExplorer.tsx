"use client";

// Трек-рекорд вышедших на биржу компаний: таблица с раундами и P/L,
// + калькулятор «что если бы вошли на раунде X».
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";

export type ExitRound = {
  round: string;
  year: number | null;
  valuationUSD: number | null;
  note: string;
  ours?: boolean; // раунд, в который входили мы (FinSight)
};

export type ExitCompany = {
  id: string;
  name: string;
  ticker: string;
  sector: string | null;
  ipoDate: string | null;
  ipoPriceUSD: number | null;
  ipoValuationUSD: number | null;
  currentPriceUSD: number | null;
  currentMarketCapUSD: number | null;
  asOf: string | null;
  rounds: ExitRound[];
};

function plPct(c: ExitCompany): number | null {
  // если есть отметка нашего входа — считаем доходность с неё
  const ours = c.rounds.find((r) => r.ours && r.valuationUSD);
  if (ours && ours.valuationUSD && c.currentMarketCapUSD) {
    return Math.round((c.currentMarketCapUSD / ours.valuationUSD - 1) * 100);
  }
  if (c.ipoPriceUSD && c.currentPriceUSD) {
    return Math.round((c.currentPriceUSD / c.ipoPriceUSD - 1) * 100);
  }
  return null;
}

function priceStr(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}`;
}

// Варианты точки входа для калькулятора
type EntryOption = { key: string; label: string; mult: number };

function entryOptions(c: ExitCompany): EntryOption[] {
  const opts: EntryOption[] = [];
  if (c.ipoPriceUSD && c.currentPriceUSD) {
    opts.push({
      key: "ipo",
      label: `IPO ${c.ipoDate ?? ""} · $${c.ipoPriceUSD}`,
      mult: c.currentPriceUSD / c.ipoPriceUSD,
    });
  }
  if (c.currentMarketCapUSD) {
    c.rounds.forEach((r, i) => {
      if (r.valuationUSD) {
        opts.push({
          key: `r${i}`,
          label: `${r.round} ${r.year ?? ""} · ${formatMoney(r.valuationUSD)}`,
          mult: c.currentMarketCapUSD! / r.valuationUSD,
        });
      }
    });
  }
  return opts;
}

type SortKey = "pl" | "name" | "mcap";

export function ExitsExplorer({ companies }: { companies: ExitCompany[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("pl");
  const [expanded, setExpanded] = useState<string | null>(null);
  // калькулятор: companyId -> { entryKey, amount }
  const [picks, setPicks] = useState<Record<string, { entryKey: string; amount: number }>>({});

  const sorted = useMemo(() => {
    const arr = [...companies];
    if (sortKey === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "mcap")
      arr.sort((a, b) => (b.currentMarketCapUSD ?? 0) - (a.currentMarketCapUSD ?? 0));
    else arr.sort((a, b) => (plPct(b) ?? -999) - (plPct(a) ?? -999));
    return arr;
  }, [companies, sortKey]);

  const winners = companies.filter((c) => (plPct(c) ?? 0) > 0).length;
  const losers = companies.filter((c) => (plPct(c) ?? 0) < 0).length;
  const best = sorted.reduce((m, c) => ((plPct(c) ?? -999) > (plPct(m) ?? -999) ? c : m), companies[0]);
  const worst = sorted.reduce((m, c) => ((plPct(c) ?? 999) < (plPct(m) ?? 999) ? c : m), companies[0]);

  // расчёт калькулятора
  const positions = companies
    .filter((c) => (picks[c.id]?.amount ?? 0) > 0)
    .map((c) => {
      const opts = entryOptions(c);
      const pick = picks[c.id];
      const opt = opts.find((o) => o.key === pick.entryKey) ?? opts[0];
      const amount = pick.amount;
      return { c, opt, amount, value: opt ? amount * opt.mult : amount };
    });
  const invested = positions.reduce((s, p) => s + p.amount, 0);
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const totalMult = invested > 0 ? totalValue / invested : 0;

  function toggle(c: ExitCompany) {
    setPicks((prev) => {
      const next = { ...prev };
      if (next[c.id]?.amount) delete next[c.id];
      else next[c.id] = { entryKey: entryOptions(c)[0]?.key ?? "ipo", amount: 10_000 };
      return next;
    });
  }

  return (
    <div className="space-y-10">
      {/* Сводка */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Компаний" value={String(companies.length)} />
        <Stat label="В плюсе / в минусе" value={`${winners} / ${losers}`} />
        <Stat
          label={`Лучшая · ${best?.ticker ?? ""}`}
          value={best ? `+${plPct(best)}%` : "—"}
          tone="positive"
        />
        <Stat
          label={`Худшая · ${worst?.ticker ?? ""}`}
          value={worst ? `${plPct(worst)}%` : "—"}
          tone="negative"
        />
      </div>

      {/* Таблица */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-text-primary">Цена акций и раунды</h2>
          <div className="flex items-center gap-2">
            <span className="kicker text-text-muted">Сортировка</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-brand focus:outline-none"
            >
              <option value="pl">По доходности</option>
              <option value="mcap">По капитализации</option>
              <option value="name">По названию</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <Th>Компания</Th>
                <Th right>Цена IPO</Th>
                <Th right>Цена сейчас</Th>
                <Th right>Доходность</Th>
                <Th right>Капитализация</Th>
                <Th right> </Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const pl = plPct(c);
                const open = expanded === c.id;
                return (
                  <FragmentRow
                    key={c.id}
                    c={c}
                    pl={pl}
                    open={open}
                    onToggle={() => setExpanded(open ? null : c.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Цены и капитализация — на {companies[0]?.asOf ?? "июнь 2026"}. Клик по
          строке — история раундов.
        </p>
      </div>

      {/* Калькулятор */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Калькулятор: что если бы вы вошли раньше?
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Выберите компании, точку входа (IPO или ранний раунд) и сумму —
            посчитаем стоимость сегодня.
          </p>
          <div className="mt-4 space-y-3">
            {sorted.map((c) => {
              const opts = entryOptions(c);
              const pick = picks[c.id];
              const active = (pick?.amount ?? 0) > 0;
              if (opts.length === 0) return null;
              return (
                <div
                  key={c.id}
                  className={`rounded-card border bg-surface p-4 transition-colors ${active ? "border-brand" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${active ? "border-brand bg-brand text-white" : "border-border bg-surface"}`}
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span>
                        <span className="block font-semibold text-text-primary">
                          {c.name}{" "}
                          <span className="text-text-muted">· {c.ticker}</span>
                        </span>
                        <span className="block text-xs text-text-secondary">{c.sector}</span>
                      </span>
                    </button>
                  </div>
                  {active && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <select
                        value={pick.entryKey}
                        onChange={(e) =>
                          setPicks((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], entryKey: e.target.value },
                          }))
                        }
                        className="rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-brand focus:outline-none"
                      >
                        {opts.map((o) => (
                          <option key={o.key} value={o.key}>
                            {o.label} → ×{o.mult.toFixed(1)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={pick.amount}
                        onChange={(e) =>
                          setPicks((prev) => ({
                            ...prev,
                            [c.id]: { ...prev[c.id], amount: Math.max(0, Math.round(Number(e.target.value))) },
                          }))
                        }
                        className="nums w-32 rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-brand focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Результат */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="kicker mb-2 text-text-muted">Итог портфеля</p>
          {positions.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-text-muted">
              Выберите компании слева — здесь появится результат.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-card border border-border bg-surface-alt p-4">
                <p className="kicker text-text-muted">Вложено</p>
                <p className="nums text-2xl font-bold text-text-primary">{formatMoney(invested)}</p>
              </div>
              <div className="rounded-card border border-border border-l-4 border-l-positive bg-surface p-4">
                <p className="kicker text-text-muted">Стоимость сегодня</p>
                <p className="nums text-2xl font-bold text-text-primary">{formatMoney(totalValue)}</p>
                <p className="nums mt-0.5 text-sm font-semibold text-positive">
                  ×{totalMult.toFixed(2).replace(".", ",")} · {totalValue >= invested ? "+" : ""}
                  {formatMoney(totalValue - invested)}
                </p>
              </div>
              <div className="rounded-card border border-border bg-surface p-4">
                <p className="kicker mb-3 text-text-muted">По позициям</p>
                <div className="space-y-2 text-sm">
                  {positions.map((p) => (
                    <div key={p.c.id} className="flex items-center justify-between gap-2">
                      <span className="text-text-primary">{p.c.ticker}</span>
                      <span className="nums text-text-secondary">
                        {formatMoney(p.amount)} → {formatMoney(p.value)}{" "}
                        <span className={p.value >= p.amount ? "text-positive" : "text-negative"}>
                          ×{p.opt ? p.opt.mult.toFixed(1) : "1"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  c,
  pl,
  open,
  onToggle,
}: {
  c: ExitCompany;
  pl: number | null;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-alt"
      >
        <td className="px-4 py-3">
          <span className="font-semibold text-text-primary">{c.name}</span>{" "}
          <span className="text-text-muted">· {c.ticker}</span>
          <span className="block text-xs text-text-secondary">{c.sector}</span>
        </td>
        <td className="nums px-4 py-3 text-right text-text-secondary">{priceStr(c.ipoPriceUSD)}</td>
        <td className="nums px-4 py-3 text-right font-medium text-text-primary">{priceStr(c.currentPriceUSD)}</td>
        <td className="nums px-4 py-3 text-right font-bold">
          {pl == null ? (
            "—"
          ) : (
            <span className={pl >= 0 ? "text-positive" : "text-negative"}>
              {pl >= 0 ? "+" : ""}
              {pl}%
            </span>
          )}
        </td>
        <td className="nums px-4 py-3 text-right text-text-secondary">{formatMoney(c.currentMarketCapUSD)}</td>
        <td className="px-4 py-3 text-right text-text-muted">{open ? "▲" : "▼"}</td>
      </tr>
      {open && (
        <tr className="border-b border-border bg-surface-alt/50">
          <td colSpan={6} className="px-4 py-4">
            <p className="kicker mb-2 text-text-muted">
              История раундов · IPO {c.ipoDate} по ${c.ipoPriceUSD} (оценка{" "}
              {formatMoney(c.ipoValuationUSD)})
            </p>
            <div className="space-y-1.5">
              {c.rounds.map((r, i) => {
                const mult =
                  c.currentMarketCapUSD && r.valuationUSD
                    ? c.currentMarketCapUSD / r.valuationUSD
                    : null;
                return (
                  <div
                    key={i}
                    className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm ${
                      r.ours ? "rounded-control bg-brand-subtle px-2 py-1" : ""
                    }`}
                  >
                    {r.ours && (
                      <span className="kicker rounded-full border border-brand bg-surface px-2 py-0.5 text-brand">
                        наш вход
                      </span>
                    )}
                    <span className="font-medium text-text-primary">{r.round}</span>
                    <span className="nums text-text-muted">{r.year ?? ""}</span>
                    <span className="nums font-semibold text-text-primary">
                      {formatMoney(r.valuationUSD)}
                    </span>
                    {mult != null && (
                      <span className="nums text-xs text-positive">→ сейчас ×{mult.toFixed(1)}</span>
                    )}
                    {r.note && <span className="text-xs text-text-muted">· {r.note}</span>}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`kicker px-4 py-2.5 text-text-muted ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const c = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-text-primary";
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="kicker text-text-muted">{label}</p>
      <p className={`nums mt-0.5 text-xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
