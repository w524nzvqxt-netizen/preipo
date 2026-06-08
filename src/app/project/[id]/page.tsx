// Страница проекта — структура: краткое содержание → метрики → сейлз-поинты →
// плюсы → риски → финмодель → документы → заявка
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatPrice, formatSize } from "@/lib/format";
import { ContactButtons } from "@/components/ContactButtons";
import { LeadForm } from "@/components/LeadForm";
import { ProjectVideo, type VideoScene } from "@/components/ProjectVideo";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer, RiskNote } from "@/components/Disclaimer";

export const dynamic = "force-dynamic";

// Разбивает многострочный текст в массив пунктов
function toList(s?: string | null): string[] {
  return (s ?? "")
    .split("\n")
    .map((x) => x.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: "asc" } } },
  });

  if (!project || !project.isActive) notFound();

  const salesPoints = toList(project.salesPoints);
  const pros = toList(project.pros);
  const risks = toList(project.risks);

  // Сценарий видео о проекте (если сгенерирован)
  let videoScenes: VideoScene[] = [];
  if (project.videoScript) {
    try {
      videoScenes = JSON.parse(project.videoScript) as VideoScene[];
    } catch {
      videoScenes = [];
    }
  }

  // Ожидаемые результаты ($100k): лучший / средний / худший
  type Scenario = {
    key: string;
    color: "emerald" | "sky" | "amber";
    mult: number;
    val: number;
    irr: string;
  };
  let scenarios: Scenario[] = [];
  if (project.scenarios) {
    try {
      scenarios = JSON.parse(project.scenarios) as Scenario[];
    } catch {
      scenarios = [];
    }
  }
  const financialDocs = project.documents.filter((d) => d.kind === "financial");
  const otherDocs = project.documents.filter((d) => d.kind !== "financial");

  const metrics: [string, string][] = [
    ["Оценка входа", formatMoney(project.valuation, project.currency)],
    ["Прогноз выхода на биржу", project.expectedExit || "—"],
    [
      "Потенциальная доходность",
      project.expectedReturn != null ? `+${project.expectedReturn}%` : "—",
    ],
    ["Цена за долю", formatPrice(project.pricePerShare, project.currency)],
    ["Доступный объём", formatMoney(project.volume, project.currency)],
    ["Отрасль / стадия", [project.sector, project.stage].filter(Boolean).join(" · ") || "—"],
  ];

  const sectorStage = [project.sector, project.stage].filter(Boolean).join(" · ") || "—";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-14">
      <Link
        href="/"
        className="text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        &larr; Все проекты
      </Link>

      {/* Шапка */}
      <Reveal className="mt-6">
        <div className="flex flex-wrap items-start gap-4">
          {/* Логотип или инициал */}
          {project.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.logoUrl}
              alt={project.name}
              className="h-16 w-16 rounded-card border border-border bg-surface object-contain p-2 shadow-[var(--shadow-card)]"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-card bg-surface-alt text-2xl font-bold text-text-muted">
              {project.name.charAt(0)}
            </div>
          )}

          {/* Название + метаданные */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                {project.name}
              </h1>
              {project.isHot && (
                <span className="kicker rounded-full border border-brand bg-brand-subtle px-2.5 py-1 text-brand">
                  Высокий спрос
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-text-muted">{sectorStage}</p>
          </div>

          {/* CTA-блок в шапке (заметен на всех разрешениях) */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-sm text-text-muted">
              Цена за долю:{" "}
              <span className="nums font-semibold text-text-primary">
                {formatPrice(project.pricePerShare, project.currency)}
              </span>
            </p>
            <a
              href="#lead"
              className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Оставить заявку
            </a>
          </div>
        </div>
      </Reveal>

      {/* Видео о проекте */}
      {project.videoStatus === "completed" &&
      project.videoUrl?.startsWith("/uploads/") ? (
        <Section kicker="Медиа" title="Видео о проекте">
          <div className="overflow-hidden rounded-card border border-border shadow-[var(--shadow-card)]">
            <video
              className="aspect-video w-full bg-surface-alt"
              controls
              preload="metadata"
              playsInline
            >
              <source src={project.videoUrl} type="video/mp4" />
            </video>
          </div>
        </Section>
      ) : (
        videoScenes.length > 0 && (
          <Section kicker="Медиа" title="Видео о проекте">
            <ProjectVideo scenes={videoScenes} title={project.name} />
          </Section>
        )
      )}

      {/* 1. Краткое содержание */}
      {project.description && (
        <Section kicker="О компании" title="Краткое содержание">
          <p className="whitespace-pre-line text-base leading-relaxed text-text-secondary">
            {project.description}
          </p>
        </Section>
      )}

      {/* 2. Ключевые показатели */}
      <Section kicker="Финансы" title="Оценка и прогноз">
        <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="bg-surface p-5">
              <p className="kicker text-text-muted">{label}</p>
              <p className="nums mt-1 text-lg font-semibold text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Ожидаемые результаты ($100k) */}
      {scenarios.length > 0 && (
        <Section kicker="Моделирование" title="Ожидаемые результаты — вложили $100 000">
          <div className="grid gap-5 sm:grid-cols-3">
            {scenarios.map((s) => {
              const borderAccent =
                s.color === "emerald"
                  ? "border-l-positive"
                  : s.color === "sky"
                    ? "border-l-accent"
                    : "border-l-warning";
              const valColor =
                s.color === "emerald"
                  ? "text-positive"
                  : s.color === "sky"
                    ? "text-accent"
                    : "text-warning";
              return (
                <div
                  key={s.key}
                  className={`rounded-card border border-border bg-surface border-l-4 ${borderAccent} p-5`}
                >
                  <div className="kicker text-text-muted">{s.key}</div>
                  <div className={`nums mt-2 text-3xl font-bold ${valColor}`}>
                    ${s.val.toLocaleString("ru-RU")}
                  </div>
                  <div className="nums mt-1 text-sm text-text-secondary">
                    &times;{s.mult.toFixed(2).replace(".", ",")} &middot; IRR {s.irr}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Горизонт ~3,6 года. Расчёт нетто: с учётом разводнения 35%, carry
            20%, fee 5% (по финансовой модели).
          </p>
          <RiskNote className="mt-2" />
        </Section>
      )}

      {/* 3. Сейлз-поинты */}
      {salesPoints.length > 0 && (
        <Section kicker="Инвест-тезис" title="Основные сейлз-поинты">
          <ul className="space-y-2">
            {salesPoints.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-control border border-border bg-surface p-4"
              >
                <span className="kicker shrink-0 text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-text-primary">{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 4. Плюсы и 5. Риски — рядом */}
      {(pros.length > 0 || risks.length > 0) && (
        <Section kicker="Анализ" title="Плюсы и риски">
          <div className="grid gap-5 sm:grid-cols-2">
            {pros.length > 0 && (
              <div className="rounded-card border border-border bg-surface p-5">
                <h3 className="font-semibold text-positive">Плюсы компании</h3>
                <ul className="mt-3 space-y-2">
                  {pros.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-positive translate-y-1.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {risks.length > 0 && (
              <div className="rounded-card border border-border bg-surface p-5">
                <h3 className="font-semibold text-warning">Риски компании</h3>
                <ul className="mt-3 space-y-2">
                  {risks.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning translate-y-1.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 6. Финансовая модель */}
      {financialDocs.length > 0 && (
        <Section kicker="Документы" title="Финансовая модель">
          <div className="space-y-2">
            {financialDocs.map((doc) => (
              <DocLink key={doc.id} doc={doc} />
            ))}
          </div>
        </Section>
      )}

      {/* 7. Документы */}
      {otherDocs.length > 0 && (
        <Section kicker="Документы" title="Материалы">
          <div className="space-y-2">
            {otherDocs.map((doc) => (
              <DocLink key={doc.id} doc={doc} />
            ))}
          </div>
        </Section>
      )}

      {/* 8. Заявка */}
      <section id="lead" className="mt-10 rounded-card border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold text-text-primary">Заинтересовал проект?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Оставьте заявку или напишите напрямую — расскажем условия входа.
        </p>
        <div className="mt-5">
          <ContactButtons />
        </div>
        <div className="mt-6 max-w-md">
          <LeadForm projectId={project.id} projectName={project.name} />
        </div>
      </section>

      <footer className="mt-12 border-t border-border pt-6">
        <Disclaimer />
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          <span>
            &copy; <span className="nums">{new Date().getFullYear()}</span> Pre-IPO Витрина
          </span>
          <Link
            href="/privacy"
            className="underline hover:text-text-secondary transition-colors"
          >
            Политика обработки персональных данных
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="mt-10">
      <div className="mb-4">
        <p className="kicker text-text-muted">{kicker}</p>
        <h2 className="mt-0.5 text-xl font-bold text-text-primary">{title}</h2>
      </div>
      {children}
    </Reveal>
  );
}

function DocLink({
  doc,
}: {
  doc: { fileUrl: string; title: string; fileName: string; sizeBytes: number };
}) {
  // Определяем метку типа файла из расширения
  const ext = doc.fileName.split(".").pop()?.toLowerCase() ?? "";
  const fileLabel =
    ext === "pdf"
      ? "PDF"
      : ext === "xlsx" || ext === "xls"
        ? "XLSX"
        : ext === "pptx" || ext === "ppt"
          ? "PPTX"
          : "DOC";

  return (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-control border border-border bg-surface px-4 py-3 transition-colors hover:border-brand shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="kicker shrink-0 rounded-control border border-border px-2 py-0.5 text-text-muted">
          {fileLabel}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-text-primary">{doc.title}</span>
          <span className="nums block text-xs text-text-muted">
            {doc.fileName} &middot; {formatSize(doc.sizeBytes)}
          </span>
        </span>
      </span>
      <span className="ml-4 shrink-0 text-sm font-semibold text-brand">Скачать &darr;</span>
    </a>
  );
}
