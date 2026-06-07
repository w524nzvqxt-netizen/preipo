// Страница проекта — структура: краткое содержание → метрики → сейлз-поинты →
// плюсы → риски → финмодель → документы → заявка
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatPrice, formatSize } from "@/lib/format";
import { ContactButtons } from "@/components/ContactButtons";
import { LeadForm } from "@/components/LeadForm";
import { ProjectVideo, type VideoScene } from "@/components/ProjectVideo";

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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-14">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Все проекты
      </Link>

      {/* Шапка */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {project.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.logoUrl}
            alt={project.name}
            className="h-16 w-16 rounded-xl border border-neutral-200 bg-white object-contain p-2"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-2xl font-bold text-neutral-500">
            {project.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold sm:text-3xl">
            {project.name}
            {project.isHot && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-medium text-amber-700">
                🔥 Горячий
              </span>
            )}
          </h1>
          <p className="text-neutral-500">
            {[project.sector, project.stage].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>

      {/* Видео о проекте */}
      {project.videoStatus === "completed" &&
      project.videoUrl?.startsWith("/uploads/") ? (
        <Section title="Видео о проекте">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 shadow-sm">
            <video
              className="aspect-video w-full bg-neutral-900"
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
          <Section title="Видео о проекте">
            <ProjectVideo scenes={videoScenes} title={project.name} />
          </Section>
        )
      )}

      {/* 1. Краткое содержание */}
      {project.description && (
        <Section title="Краткое содержание">
          <p className="whitespace-pre-line text-lg leading-relaxed text-neutral-700">
            {project.description}
          </p>
        </Section>
      )}

      {/* 2. Ключевые показатели */}
      <Section title="Оценка и прогноз">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="bg-white p-5">
              <p className="text-sm text-neutral-500">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Ожидаемые результаты ($100k) */}
      {scenarios.length > 0 && (
        <Section title="Ожидаемые результаты — вложили $100 000">
          <div className="grid gap-5 sm:grid-cols-3">
            {scenarios.map((s) => {
              const c =
                s.color === "emerald"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : s.color === "sky"
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-amber-300 bg-amber-50 text-amber-700";
              return (
                <div
                  key={s.key}
                  className={`rounded-2xl border p-5 text-center shadow-sm ${c}`}
                >
                  <div className="text-sm font-semibold">{s.key}</div>
                  <div className="mt-2 text-3xl font-bold text-neutral-900">
                    ${s.val.toLocaleString("ru-RU")}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    ×{s.mult.toFixed(2).replace(".", ",")} · IRR {s.irr}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            Горизонт ~3,6 года. Расчёт нетто: с учётом разводнения 35%, carry
            20%, fee 5% (по финансовой модели). Не является гарантией доходности.
          </p>
        </Section>
      )}

      {/* 3. Сейлз-поинты */}
      {salesPoints.length > 0 && (
        <Section title="Основные сейлз-поинты">
          <ul className="space-y-2">
            {salesPoints.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <span className="text-emerald-600">★</span>
                <span className="text-neutral-800">{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 4. Плюсы и 5. Риски — рядом */}
      {(pros.length > 0 || risks.length > 0) && (
        <Section title="Плюсы и риски">
          <div className="grid gap-5 sm:grid-cols-2">
            {pros.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-emerald-700">✓ Плюсы компании</h3>
                <ul className="mt-3 space-y-2">
                  {pros.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-700">
                      <span className="text-emerald-500">+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {risks.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-amber-700">⚠ Риски компании</h3>
                <ul className="mt-3 space-y-2">
                  {risks.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-700">
                      <span className="text-amber-500">–</span> {p}
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
        <Section title="Финансовая модель">
          <div className="space-y-2">
            {financialDocs.map((doc) => (
              <DocLink key={doc.id} doc={doc} accent />
            ))}
          </div>
        </Section>
      )}

      {/* 7. Документы */}
      {otherDocs.length > 0 && (
        <Section title="Документы">
          <div className="space-y-2">
            {otherDocs.map((doc) => (
              <DocLink key={doc.id} doc={doc} />
            ))}
          </div>
        </Section>
      )}

      {/* 8. Заявка */}
      <section className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold">Заинтересовал проект?</h2>
        <p className="mt-2 text-neutral-600">
          Оставьте заявку или напишите напрямую — расскажем условия входа.
        </p>
        <div className="mt-5">
          <ContactButtons />
        </div>
        <div className="mt-6 max-w-md">
          <LeadForm projectId={project.id} projectName={project.name} />
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function DocLink({
  doc,
  accent,
}: {
  doc: { fileUrl: string; title: string; fileName: string; sizeBytes: number };
  accent?: boolean;
}) {
  return (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm transition-colors hover:border-emerald-400 ${
        accent ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <span>{accent ? "📊" : "📄"}</span>
        <span>
          <span className="font-medium">{doc.title}</span>
          <span className="block text-xs text-neutral-500">
            {doc.fileName} · {formatSize(doc.sizeBytes)}
          </span>
        </span>
      </span>
      <span className="text-sm font-medium text-emerald-600">Скачать ↓</span>
    </a>
  );
}
