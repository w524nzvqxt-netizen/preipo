"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { formatMoney, formatPrice } from "@/lib/format";
import type { Project } from "@/generated/prisma/client";

type SortKey = "expectedReturn" | "volume" | "valuation" | "expectedExit";
type ViewMode = "cards" | "table";

export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [sector, setSector] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("expectedReturn");
  const [view, setView] = useState<ViewMode>("cards");

  const sectors = useMemo(() => {
    const unique = Array.from(
      new Set(projects.map((p) => p.sector).filter((s): s is string => Boolean(s)))
    );
    return unique.sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let result = sector === "all" ? projects : projects.filter((p) => p.sector === sector);

    result = [...result].sort((a, b) => {
      if (sortKey === "expectedReturn") {
        const av = a.expectedReturn ?? null;
        const bv = b.expectedReturn ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av;
      }
      if (sortKey === "volume") {
        const av = a.volume ?? null;
        const bv = b.volume ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av;
      }
      if (sortKey === "valuation") {
        const av = a.valuation ?? null;
        const bv = b.valuation ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av;
      }
      if (sortKey === "expectedExit") {
        const av = a.expectedExit ?? null;
        const bv = b.expectedExit ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return av.localeCompare(bv);
      }
      return 0;
    });

    return result;
  }, [projects, sector, sortKey]);

  const selectClass =
    "border border-border rounded-control bg-surface text-text-primary px-3 py-2 text-sm focus:border-brand focus:outline-none";

  return (
    <div className="flex flex-col gap-5">
      {/* Панель управления */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface-alt p-3">
        {/* Фильтр по сектору */}
        <select
          className={selectClass}
          value={sector}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSector(e.target.value)}
        >
          <option value="all">Все сектора</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Сортировка */}
        <select
          className={selectClass}
          value={sortKey}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSortKey(e.target.value as SortKey)
          }
        >
          <option value="expectedReturn">По доходности</option>
          <option value="volume">По объёму</option>
          <option value="valuation">По оценке</option>
          <option value="expectedExit">По сроку выхода</option>
        </select>

        {/* Разделитель */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setView("cards")}
            className={`rounded-control px-3 py-2 text-sm transition-colors ${
              view === "cards"
                ? "bg-brand text-white"
                : "border border-border text-text-secondary hover:bg-surface"
            }`}
          >
            Карточки
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded-control px-3 py-2 text-sm transition-colors ${
              view === "table"
                ? "bg-brand text-white"
                : "border border-border text-text-secondary hover:bg-surface"
            }`}
          >
            Таблица
          </button>
        </div>
      </div>

      {/* Режим: Карточки */}
      {view === "cards" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Режим: Таблица */}
      {view === "table" && (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="kicker px-4 py-3 text-left text-text-muted">Компания</th>
                <th className="kicker px-4 py-3 text-left text-text-muted">Сектор</th>
                <th className="kicker px-4 py-3 text-right text-text-muted">Оценка</th>
                <th className="kicker px-4 py-3 text-right text-text-muted">Цена за долю</th>
                <th className="kicker px-4 py-3 text-right text-text-muted">Объём</th>
                <th className="kicker px-4 py-3 text-right text-text-muted">Прогноз выхода</th>
                <th className="kicker px-4 py-3 text-right text-text-muted">Потенц. доходность</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-surface-alt"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/project/${p.id}`}
                      className="font-semibold text-text-primary hover:text-brand"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.sector || "—"}
                  </td>
                  <td className="nums px-4 py-3 text-right text-text-primary">
                    {formatMoney(p.valuation, p.currency)}
                  </td>
                  <td className="nums px-4 py-3 text-right text-text-primary">
                    {formatPrice(p.pricePerShare, p.currency)}
                  </td>
                  <td className="nums px-4 py-3 text-right text-text-primary">
                    {formatMoney(p.volume, p.currency)}
                  </td>
                  <td className="nums px-4 py-3 text-right text-text-secondary">
                    {p.expectedExit || "—"}
                  </td>
                  <td className="nums px-4 py-3 text-right font-semibold text-positive">
                    {p.expectedReturn != null ? `+${p.expectedReturn}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
