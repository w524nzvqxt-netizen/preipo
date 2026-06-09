"use client";

// Конструктор портфеля из открытых раундов.
// Пользователь выбирает раунды и суммы → получает результат по 3 сценариям
// (худший/базовый/лучший) и дорожную карту IPO по позициям.
import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

export type Round = {
  id: string;
  name: string;
  sector: string | null;
  valuation: number | null;
  currency: string;
  expectedExit: string | null;
  expectedReturn: number | null;
  illustrative: boolean;
  worst: number;
  base: number;
  best: number;
};

const PRESETS = [50_000, 100_000, 250_000, 500_000];

const SCENARIOS = [
  { key: "worst" as const, label: "Худший", tone: "warning" },
  { key: "base" as const, label: "Базовый", tone: "accent" },
  { key: "best" as const, label: "Лучший", tone: "positive" },
];

function exitYear(s: string | null): number {
  const m = (s ?? "").match(/(20\d{2})/);
  return m ? parseInt(m[1], 10) : 9999;
}

function multFor(r: Round, key: "worst" | "base" | "best") {
  return key === "worst" ? r.worst : key === "base" ? r.base : r.best;
}

export function PortfolioBuilder({ rounds }: { rounds: Round[] }) {
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const positions = rounds.filter((r) => (amounts[r.id] ?? 0) > 0);
  const invested = positions.reduce((s, r) => s + (amounts[r.id] || 0), 0);

  const results = useMemo(
    () =>
      SCENARIOS.map((s) => {
        const value = positions.reduce(
          (sum, r) => sum + (amounts[r.id] || 0) * multFor(r, s.key),
          0
        );
        return {
          ...s,
          value,
          mult: invested > 0 ? value / invested : 0,
          profit: value - invested,
        };
      }),
    [positions, amounts, invested]
  );

  const roadmap = useMemo(
    () =>
      [...positions].sort(
        (a, b) => exitYear(a.expectedExit) - exitYear(b.expectedExit)
      ),
    [positions]
  );

  const hasIllustrative = positions.some((p) => p.illustrative);

  function toggle(r: Round) {
    setAmounts((prev) => {
      const next = { ...prev };
      if ((next[r.id] ?? 0) > 0) delete next[r.id];
      else next[r.id] = 100_000;
      return next;
    });
  }

  function setAmount(id: string, v: number) {
    setAmounts((prev) => ({ ...prev, [id]: Math.max(0, Math.round(v)) }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Выбор раундов */}
      <div>
        <p className="kicker mb-2 text-text-muted">Шаг 1</p>
        <h2 className="text-xl font-bold text-text-primary">
          Выберите сделки и суммы
        </h2>
        <div className="mt-4 space-y-3">
          {rounds.map((r) => {
            const amount = amounts[r.id] ?? 0;
            const active = amount > 0;
            return (
              <div
                key={r.id}
                className={`rounded-card border bg-surface p-4 transition-colors ${
                  active ? "border-brand" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(r)}
                    className="flex items-start gap-3 text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        active
                          ? "border-brand bg-brand text-bg"
                          : "border-border bg-surface"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    <span>
                      <span className="block font-semibold text-text-primary">
                        {r.name}
                      </span>
                      <span className="block text-sm text-text-secondary">
                        {r.sector || "—"}
                      </span>
                    </span>
                  </button>
                  <div className="text-right">
                    <p className="kicker text-text-muted">Базовый</p>
                    <p className="nums font-bold text-positive">
                      ×{r.base.toFixed(1).replace(".", ",")}
                    </p>
                    <p className="nums mt-0.5 text-xs text-text-muted">
                      выход {r.expectedExit || "—"}
                    </p>
                  </div>
                </div>

                {active && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAmount(r.id, p)}
                          className={`nums rounded-control border px-2.5 py-1 text-xs font-medium transition-colors ${
                            amount === p
                              ? "border-brand bg-brand-subtle text-brand"
                              : "border-border text-text-secondary hover:bg-surface-alt"
                          }`}
                        >
                          {formatMoney(p, r.currency)}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={amount}
                        onChange={(e) => setAmount(r.id, Number(e.target.value))}
                        className="nums w-32 rounded-control border border-border bg-surface px-3 py-1 text-sm text-text-primary focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Результат портфеля */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="kicker mb-2 text-text-muted">Шаг 2 · ваш портфель</p>

        {positions.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-text-muted">
            Добавьте раунды слева — здесь появится результат по трём сценариям и
            дорожная карта IPO.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Сумма вложений */}
            <div className="rounded-card border border-border bg-surface-alt p-4">
              <p className="kicker text-text-muted">Вложено в портфель</p>
              <p className="nums text-2xl font-bold text-text-primary">
                {formatMoney(invested)}
              </p>
              <p className="mt-0.5 text-sm text-text-secondary">
                {positions.length} поз. ·{" "}
                {roadmap[0]?.expectedExit
                  ? `ближайший выход ${roadmap[0].expectedExit}`
                  : ""}
              </p>
            </div>

            {/* 3 сценария */}
            <div className="space-y-3">
              {results.map((s) => {
                const tone =
                  s.tone === "positive"
                    ? "text-positive border-l-positive"
                    : s.tone === "accent"
                      ? "text-accent border-l-accent"
                      : "text-warning border-l-warning";
                return (
                  <div
                    key={s.key}
                    className={`rounded-card border border-border border-l-4 bg-surface p-4 ${tone}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="kicker text-text-muted">{s.label}</span>
                      <span className="nums font-bold">
                        ×{s.mult.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <p className="nums mt-1 text-2xl font-bold text-text-primary">
                      {formatMoney(s.value)}
                    </p>
                    <p className="nums mt-0.5 text-sm text-text-secondary">
                      {s.profit >= 0 ? "прибыль " : "убыток "}
                      {formatMoney(Math.abs(s.profit))}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Состав портфеля */}
            <div className="rounded-card border border-border bg-surface p-4">
              <p className="kicker mb-3 text-text-muted">Состав портфеля</p>
              <div className="space-y-2">
                {positions.map((r) => {
                  const pct = invested > 0 ? ((amounts[r.id] || 0) / invested) * 100 : 0;
                  return (
                    <div key={r.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-primary">{r.name}</span>
                        <span className="nums text-text-secondary">
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Дорожная карта IPO */}
            <div className="rounded-card border border-border bg-surface p-4">
              <p className="kicker mb-3 text-text-muted">Дорожная карта IPO</p>
              <ol className="relative space-y-4 border-l border-border pl-4">
                {roadmap.map((r) => (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-brand bg-surface" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-text-primary">
                        {r.name}
                      </span>
                      <span className="nums text-sm font-medium text-brand">
                        {r.expectedExit || "—"}
                      </span>
                    </div>
                    <p className="nums text-xs text-text-muted">
                      база ×{r.base.toFixed(1).replace(".", ",")}
                      {r.expectedReturn != null
                        ? ` · ~${r.expectedReturn}% годовых`
                        : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <Link
              href="/#contact"
              className="block rounded-control bg-brand px-5 py-3 text-center font-semibold text-bg transition-colors hover:brightness-110"
            >
              Обсудить портфель
            </Link>

            {hasIllustrative && (
              <p className="text-xs leading-relaxed text-text-muted">
                Множители по позициям, отмеченным как открытые раунды без
                подтверждённой финмодели, носят иллюстративный (модельный)
                характер и не являются гарантией доходности или индивидуальной
                инвестиционной рекомендацией. Расчёт по сценариям — нетто к
                вложенной сумме.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
