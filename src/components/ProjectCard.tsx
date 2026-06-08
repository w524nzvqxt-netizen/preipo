// Карточка проекта на витрине
import Link from "next/link";
import { formatMoney, formatPrice } from "@/lib/format";
import type { Project } from "@/generated/prisma/client";

export function ProjectCard({ project }: { project: Project }) {
  const isClosed = project.dealStatus === "closed";

  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex flex-col rounded-card border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:border-brand hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Шапка: лого + название + бейдж */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {project.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.logoUrl}
              alt={project.name}
              className="h-11 w-11 rounded-control border border-border bg-surface object-contain p-1.5"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-control bg-surface-alt text-lg font-bold text-text-muted">
              {project.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold leading-tight text-text-primary">
              {project.name}
            </h3>
            <p className="text-sm text-text-secondary">
              {[project.sector, project.stage].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        {isClosed ? (
          <span className="kicker rounded-full border border-border bg-surface-alt px-2 py-0.5 text-text-muted">
            Реализована
          </span>
        ) : (
          project.isHot && (
            <span className="kicker rounded-full border border-brand bg-brand-subtle px-2 py-0.5 text-brand">
              Высокий спрос
            </span>
          )
        )}
      </div>

      {/* Описание */}
      {project.description && (
        <p className="mt-3 line-clamp-2 text-sm text-text-secondary">
          {project.description}
        </p>
      )}

      {/* Герой — мультипликатор (закрытая) или доходность (открытая) */}
      {isClosed && project.cocMultiple != null ? (
        <div className="mt-4 rounded-control bg-brand-subtle px-3 py-2.5">
          <p className="kicker text-text-muted">Потенциал на капитал · базовый</p>
          <p className="nums mt-0.5 text-xl font-bold text-positive">
            ×{project.cocMultiple.toFixed(1).replace(".", ",")}
            {project.expectedReturn != null && (
              <span className="ml-2 text-sm font-semibold text-text-secondary">
                ~{project.expectedReturn}% годовых
              </span>
            )}
          </p>
        </div>
      ) : (
        project.expectedReturn != null && (
          <div className="mt-4 rounded-control bg-brand-subtle px-3 py-2.5">
            <p className="kicker text-text-muted">Потенц. доходность</p>
            <p className="nums mt-0.5 text-xl font-bold text-positive">
              +{project.expectedReturn}%
            </p>
          </div>
        )
      )}

      {/* Сетка метрик */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <Metric label="Оценка входа" value={formatMoney(project.valuation, project.currency)} />
        <Metric label="Прогноз выхода" value={project.expectedExit || "—"} />
        {isClosed ? (
          <Metric
            label="Оценка на выходе"
            value={formatMoney(project.exitValuation, project.currency)}
          />
        ) : (
          <Metric label="Цена за долю" value={formatPrice(project.pricePerShare, project.currency)} />
        )}
        {isClosed ? (
          <Metric label="Доходность (нетто)" value={project.expectedReturn != null ? `~${project.expectedReturn}%` : "—"} />
        ) : (
          <Metric label="Объём" value={formatMoney(project.volume, project.currency)} />
        )}
      </div>

      {/* CTA */}
      <span className="mt-4 text-sm font-medium text-brand">
        Подробнее →
      </span>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="kicker text-text-muted">{label}</p>
      <p className="nums font-semibold text-text-primary">{value}</p>
    </div>
  );
}
