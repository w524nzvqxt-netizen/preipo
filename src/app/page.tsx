// Главная страница — публичная витрина pre-IPO проектов
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContactButtons } from "@/components/ContactButtons";
import { LeadForm } from "@/components/LeadForm";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";
import { ProjectsExplorer } from "@/components/ProjectsExplorer";
import { ProjectCard } from "@/components/ProjectCard";

// Витрина всегда отражает актуальные данные из админки
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const all = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
  });

  // Открытые раунды (можно войти) и реализованные сделки (трек-рекорд)
  const projects = all.filter((p) => p.dealStatus !== "closed");
  const closedDeals = all.filter((p) => p.dealStatus === "closed");

  // KPI для hero
  const withReturn = all.filter((p) => p.expectedReturn != null);
  const avgReturn = withReturn.length
    ? Math.round(
        withReturn.reduce((s, p) => s + (p.expectedReturn ?? 0), 0) /
          withReturn.length
      )
    : 0;

  return (
    <div className="bg-bg">
      {/* Бегущая строка котировок */}
      <div>
        <Ticker />
      </div>

      {/* Шапка */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <span className="text-brand">●</span> Pre-IPO Витрина
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/exits"
              className="hidden text-sm font-medium text-text-secondary hover:text-brand sm:block"
            >
              Уже на бирже
            </Link>
            <Link
              href="/portfolio"
              className="hidden text-sm font-medium text-text-secondary hover:text-brand sm:block"
            >
              Конструктор портфеля
            </Link>
            <ContactButtons size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        {/* Hero с видео и анимациями */}
        <Hero
          dealCount={all.length}
          closedCount={closedDeals.length}
          avgReturn={avgReturn}
        />

        {/* Видео-объяснялка — «Pre-IPO: Инструкция для инвестора» */}
        <section id="about" className="mt-14 sm:mt-20">
          <Reveal>
            <p className="kicker mb-3 text-text-muted">
              Pre-IPO: инструкция для инвестора
            </p>
            <div className="border border-border rounded-card overflow-hidden">
              <video
                className="aspect-video w-full bg-surface-alt"
                controls
                preload="metadata"
                playsInline
                poster="/uploads/poster-main.jpg"
              >
                <source src="/uploads/main-pre-ipo.mp4" type="video/mp4" />
              </video>
            </div>
          </Reveal>
        </section>

        {/* Слоган */}
        <section className="mt-16 sm:mt-20">
          <div className="bg-surface-alt rounded-card px-6 py-10 text-center sm:px-10 sm:py-14">
            <p className="text-2xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl">
              Завтрашние <span className="text-brand">лидеры</span> рынка сегодня ещё{" "}
              <span className="text-brand">частные</span>
            </p>
          </div>
        </section>

        {/* Блоки-преимущества */}
        <section className="mt-16 sm:mt-20">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <FeatureCard {...f} index={i} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Сетка проектов */}
        <section id="projects" className="mt-20 sm:mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker mb-2 text-text-muted">Витрина</p>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Доступные проекты
              </h2>
            </div>
            <Link
              href="/portfolio"
              className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Собрать портфель →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="mt-6 rounded-card border border-dashed border-border p-10 text-center text-text-muted">
              Пока нет активных проектов.
            </div>
          ) : (
            <div className="mt-6">
              <ProjectsExplorer projects={projects} />
            </div>
          )}
        </section>

        {/* Реализованные сделки — трек-рекорд */}
        {closedDeals.length > 0 && (
          <section id="track-record" className="mt-20 sm:mt-24">
            <p className="kicker mb-2 text-text-muted">Трек-рекорд</p>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Закрытые раунды
            </h2>
            <p className="mt-2 max-w-2xl text-text-secondary">
              Раунды, которые мы уже закрыли для инвесторов. Параметры — на момент
              входа в сделку.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {closedDeals.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 0.06}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Контакт */}
        <section id="contact" className="mt-20 sm:mt-24">
          <Reveal>
            <div className="bg-surface border border-border rounded-card p-6 sm:p-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="kicker mb-2 text-text-muted">Связаться</p>
                  <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    Связаться с нами
                  </h2>
                  <p className="mt-3 text-text-secondary">
                    Оставьте заявку или напишите напрямую — ответим и подберём
                    проект под ваши задачи.
                  </p>
                  <div className="mt-6">
                    <ContactButtons />
                  </div>
                </div>
                <div className="bg-surface-alt rounded-card p-5 sm:p-6">
                  <LeadForm />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="mt-16 border-t border-border pt-6 text-sm">
          <Disclaimer />
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-text-muted">
            <span className="nums">© {new Date().getFullYear()} Pre-IPO Витрина</span>
            <Link href="/privacy" className="text-text-muted underline hover:text-text-secondary">
              Политика обработки персональных данных
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

const FEATURES: {
  title: string;
  text: string;
  accent: "positive" | "warning" | "accent";
}[] = [
  {
    title: "Высокая потенциальная доходность",
    text: "Вход на стадии роста — по оценке частного раунда. Потенциал кратного роста стоимости доли к моменту выхода на биржу или продажи компании.",
    accent: "positive",
  },
  {
    title: "Риски",
    text: "Честно о главном: инвестиции в частные компании неликвидны, IPO и заявленная доходность не гарантированы, возможна полная потеря капитала.",
    accent: "warning",
  },
  {
    title: "Уникальные предложения",
    text: "Закрытые сделки и проекты, недоступные на открытом рынке. Отбираем вручную и сопровождаем вход в сделку.",
    accent: "accent",
  },
];

function FeatureCard({
  title,
  text,
  accent,
  index,
}: {
  title: string;
  text: string;
  accent: "positive" | "warning" | "accent";
  index: number;
}) {
  const borderAccent =
    accent === "positive"
      ? "border-l-positive"
      : accent === "warning"
        ? "border-l-warning"
        : "border-l-accent";

  const num = String(index + 1).padStart(2, "0");

  return (
    <div
      className={`h-full bg-surface border border-border border-l-4 ${borderAccent} rounded-card p-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]`}
    >
      <p className="kicker text-text-muted mb-3">{num}</p>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}
