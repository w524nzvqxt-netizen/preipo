// Главная страница — публичная витрина pre-IPO проектов
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/components/ProjectCard";
import { ContactButtons } from "@/components/ContactButtons";
import { LeadForm } from "@/components/LeadForm";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/motion/Reveal";
import { AnimatedWords } from "@/components/motion/AnimatedWords";

// Витрина всегда отражает актуальные данные из админки
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
  });

  const totalVolume = projects.reduce((s, p) => s + (p.volume ?? 0), 0);

  return (
    <div className="relative overflow-hidden">
      {/* Декоративный фон с градиентными блобами */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob left-[-10%] top-[-5%] h-[420px] w-[420px] bg-emerald-300" />
        <div
          className="blob right-[-8%] top-[10%] h-[360px] w-[360px] bg-sky-300"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="blob bottom-[10%] left-[20%] h-[400px] w-[400px] bg-teal-200"
          style={{ animationDelay: "6s" }}
        />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        {/* Шапка */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/70 bg-white/60 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-emerald-600">●</span> Pre-IPO Витрина
          </div>
          <ContactButtons size="sm" />
        </header>

        {/* Hero с видео и анимациями */}
        <Hero
          projectCount={projects.length}
          totalVolume={totalVolume}
          hotCount={projects.filter((p) => p.isHot).length}
        />

        {/* Основное видео — «Pre-IPO: Инструкция для инвестора» */}
        <section id="about" className="mt-14 sm:mt-20">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Pre-IPO: инструкция для инвестора
            </p>
            <div className="glow overflow-hidden rounded-3xl border border-neutral-200 shadow-sm">
              <video
                className="aspect-video w-full bg-neutral-900"
                controls
                preload="metadata"
                playsInline
                poster="/uploads/prometheus.jpg"
              >
                <source src="/uploads/main-pre-ipo.mp4" type="video/mp4" />
              </video>
            </div>
          </Reveal>
        </section>

        {/* Слоган-полоса */}
        <section className="mt-20 sm:mt-28">
          <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-6 py-12 text-center sm:px-10 sm:py-16">
            <AnimatedWords
              text="Завтрашние лидеры рынка сегодня ещё частные"
              className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl"
              highlight={["лидеры", "частные"]}
            />
          </div>
        </section>

        {/* Блоки-преимущества */}
        <section className="mt-16 sm:mt-20">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.12}>
                <FeatureCard {...f} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Сетка проектов */}
        <section id="projects" className="mt-20 sm:mt-24">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <AnimatedWords text="Доступные проекты" highlight={["проекты"]} />
          </h2>
          {projects.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
              Пока нет активных проектов. Добавьте их в{" "}
              <Link href="/admin" className="text-emerald-600 underline">
                админке
              </Link>
              .
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 0.1}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* Контакт */}
        <section id="contact" className="mt-20 sm:mt-24">
          <Reveal>
            <div className="grid gap-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  <AnimatedWords text="Связаться с нами" highlight={["нами"]} />
                </h2>
                <p className="mt-3 text-neutral-600">
                  Оставьте заявку или напишите напрямую — ответим и подберём
                  проект под ваши задачи.
                </p>
                <div className="mt-6">
                  <ContactButtons />
                </div>
              </div>
              <LeadForm />
            </div>
          </Reveal>
        </section>

        <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          <p className="max-w-3xl text-xs text-neutral-400">
            Информация на сайте носит ознакомительный характер и не является
            инвестиционной рекомендацией или публичной офертой. Решение об
            инвестициях принимается самостоятельно с учётом всех рисков.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Pre-IPO Витрина</span>
            <Link href="/admin" className="hover:text-neutral-900">
              Админка
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📈",
    title: "Высокая потенциальная доходность",
    text: "Вход на стадии роста — по оценке частного раунда. Потенциал кратного роста стоимости доли к моменту выхода на биржу или продажи компании.",
    accent: "emerald",
  },
  {
    icon: "⚠️",
    title: "Риски",
    text: "Честно о главном: инвестиции в частные компании неликвидны, IPO и заявленная доходность не гарантированы, возможна полная потеря капитала.",
    accent: "amber",
  },
  {
    icon: "⭐",
    title: "Уникальные предложения",
    text: "Закрытые сделки и проекты, недоступные на открытом рынке. Отбираем вручную и сопровождаем вход в сделку.",
    accent: "sky",
  },
] as const;

function FeatureCard({
  icon,
  title,
  text,
  accent,
}: {
  icon: string;
  title: string;
  text: string;
  accent: "emerald" | "amber" | "sky";
}) {
  const ring =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : accent === "amber"
        ? "border-amber-200 bg-amber-50"
        : "border-sky-200 bg-sky-50";
  return (
    <div className="h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${ring}`}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{text}</p>
    </div>
  );
}
