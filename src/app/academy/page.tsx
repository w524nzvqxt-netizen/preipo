// Раздел «Академия инвестора»: обучающие видео — оценка компаний, метод выбора, риски.
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Академия инвестора — обучение pre-IPO: оценка, выбор, риски",
  description: "Обучающие видео для инвестора: как оценивать частные компании, как выбирать сделку и как управлять рисками pre-IPO. Без хайпа, по существу.",
};

type Lesson = {
  n: string;
  slug: string;
  title: string;
  kicker: string;
  desc: string;
  points: string[];
};

const LESSONS: Lesson[] = [
  {
    n: "01",
    slug: "academy-valuation",
    kicker: "Оценка",
    title: "Как оценивать компанию",
    desc: "Что такое оценка, откуда берутся цифры раундов и как посчитать реальный потенциал сделки — а не «иксы» из рекламы.",
    points: [
      "Что такое оценка и post-money",
      "Раунды и переоценка бизнеса",
      "Метрики: выручка, рост, ARR, маржа",
      "Мультипликаторы и потенциал: TVPI, IRR",
      "Чистая доходность после разводнения и комиссий",
    ],
  },
  {
    n: "02",
    slug: "academy-method",
    kicker: "Метод",
    title: "Как выбрать сделку",
    desc: "Четыре вопроса, по которым профессионалы отбирают компании. Логика, на чём бизнес заработает, — вместо хайпа.",
    points: [
      "Команда и трек-рекорд основателей",
      "Рост бизнеса, а не только оценки",
      "Цена входа и запас прочности",
      "Горизонт выхода и ликвидность",
      "Диверсификация: часть портфеля",
    ],
  },
  {
    n: "03",
    slug: "academy-risks",
    kicker: "Риски",
    title: "Риски pre-IPO",
    desc: "Честно о том, что может пойти не так — неликвидность, lock-up, переоценка — и как этим управлять.",
    points: [
      "Неликвидность: деньги заморожены на 2–5 лет",
      "Lock-up после выхода на биржу",
      "Риск оценки и down-round",
      "Разводнение доли и blind pool у фондов",
      "Готовность к частичной или полной потере",
    ],
  },
];

export default function AcademyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <Link href="/" className="text-sm text-text-muted transition-colors hover:text-text-primary">&larr; На главную</Link>

      <Reveal className="mt-6">
        <p className="kicker text-brand">Обучение · Pre-IPO</p>
        <h1 className="mt-2 text-3xl font-bold text-text-primary sm:text-4xl">Академия инвестора</h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Три коротких видео-урока: как оценивать частные компании, как выбирать сделку и как
          управлять рисками. По существу, без хайпа и обещаний «иксов».
        </p>
      </Reveal>

      <div className="mt-10 space-y-8">
        {LESSONS.map((l) => (
          <Reveal key={l.slug}>
            <article className="overflow-hidden rounded-card border border-border bg-surface shadow-[var(--shadow-card)]">
              <div className="hairline border-b border-border">
                <video
                  className="aspect-video w-full bg-black"
                  controls
                  preload="metadata"
                  playsInline
                >
                  <source src={`/uploads/${l.slug}-video.mp4`} type="video/mp4" />
                </video>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="nums text-sm font-semibold text-brand">{l.n}</span>
                  <span className="kicker rounded-pill border border-border bg-surface-alt px-2.5 py-1 text-text-muted">{l.kicker}</span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-text-primary sm:text-2xl">{l.title}</h2>
                <p className="mt-2 text-text-secondary">{l.desc}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {l.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 shrink-0 text-brand">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12">
        <div className="rounded-card border border-border bg-surface-alt p-6 text-center">
          <h3 className="text-lg font-bold text-text-primary">Готовы применить на практике?</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
            Посмотрите будущих гигантов pre-IPO с разбором оценок и раундов — и оставьте заявку на доступ.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/base" className="rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand">
              Будущие гиганты
            </Link>
            <Link href="/#quiz" className="btn-brand rounded-control px-5 py-2.5 text-sm font-semibold">
              Получить доступ
            </Link>
          </div>
        </div>
      </Reveal>

      <footer className="mt-12 border-t border-border pt-6">
        <Disclaimer />
      </footer>
    </main>
  );
}
