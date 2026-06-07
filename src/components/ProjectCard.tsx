// Карточка проекта на витрине
import Link from "next/link";
import { formatMoney, formatPrice } from "@/lib/format";
import type { Project } from "@/generated/prisma/client";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {project.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.logoUrl}
              alt={project.name}
              className="h-11 w-11 rounded-lg border border-neutral-200 bg-white object-contain p-1.5"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-lg font-bold text-neutral-500">
              {project.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold leading-tight">{project.name}</h3>
            <p className="text-sm text-neutral-500">
              {[project.sector, project.stage].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        {project.isHot && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            🔥 Горячий
          </span>
        )}
      </div>

      {project.description && (
        <p className="mt-3 line-clamp-2 text-sm text-neutral-500">
          {project.description}
        </p>
      )}

      {project.expectedReturn != null && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
          <span className="text-sm text-emerald-700/80">Потенц. доходность</span>
          <span className="font-semibold text-emerald-700">
            +{project.expectedReturn}%
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-200 pt-4">
        <Metric label="Оценка входа" value={formatMoney(project.valuation, project.currency)} />
        <Metric label="Прогноз выхода" value={project.expectedExit || "—"} />
        <Metric label="Цена за долю" value={formatPrice(project.pricePerShare, project.currency)} />
        <Metric label="Объём" value={formatMoney(project.volume, project.currency)} />
      </div>

      <span className="mt-4 text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
        Подробнее →
      </span>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
