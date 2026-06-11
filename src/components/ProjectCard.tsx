// Deal-sheet карточка сделки на витрине: не «иксы», а условия входа.
// Private-markets тон: сектор, стадия, мин. чек, горизонт, ликвидность, риск, статус.
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Project } from "@/generated/prisma/client";

export function ProjectCard({ project }: { project: Project }) {
  const isClosed = project.dealStatus === "closed";
  const status = isClosed ? "Закрыто" : "Доступно";
  const minTicket = project.minTicket != null ? formatMoney(project.minTicket, project.currency) : "по запросу";
  const horizon = project.expectedExit || "2–5 лет";

  const rows: { label: string; value: string; accent?: "warning" }[] = [
    { label: "Сектор", value: project.sector || "Late-stage private" },
    { label: "Стадия", value: project.stage || "Late-stage" },
    { label: "Мин. чек", value: minTicket },
    { label: "Горизонт", value: horizon },
    { label: "Ликвидность", value: "низкая" },
    { label: "Риск", value: "высокий", accent: "warning" },
  ];

  return (
    <Link
      href={`/project/${project.id}`}
      className="card-premium group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface p-5 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
    >
      {/* Шапка: лого + название + статус */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {project.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.logoUrl}
              alt={project.name}
              className="h-11 w-11 shrink-0 rounded-control border border-border bg-surface object-contain p-1.5 transition-colors duration-300 group-hover:border-brand/40"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-alt text-lg font-bold text-text-muted">
              {project.name.charAt(0)}
            </div>
          )}
          <h3 className="truncate text-base font-semibold leading-tight text-text-primary">{project.name}</h3>
        </div>
        <span
          className={`kicker shrink-0 rounded-pill border px-2.5 py-1 ${
            isClosed
              ? "border-border bg-surface-alt text-text-muted"
              : "border-brand/40 bg-brand-subtle text-brand"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Deal sheet */}
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-border bg-border">
        {rows.map((r) => (
          <div key={r.label} className="bg-surface px-3 py-2.5">
            <dt className="kicker text-text-muted">{r.label}</dt>
            <dd className={`nums mt-0.5 text-sm font-semibold ${r.accent === "warning" ? "text-warning" : "text-text-primary"}`}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* CTA */}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        Запросить deal memo
        <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none">→</span>
      </span>
    </Link>
  );
}
