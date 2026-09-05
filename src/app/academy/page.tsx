// Раздел «Академия инвестора»: обучающие видео — оценка компаний, метод выбора, риски.
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";

const TITLE = "Академия инвестора — обучение pre-IPO: оценка, выбор, риски";
const DESC = "Обучающие видео для инвестора: как оценивать частные компании, как выбирать сделку и как управлять рисками pre-IPO. Без хайпа, по существу.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/academy" },
  openGraph: { type: "website", title: TITLE, description: DESC, url: "/academy", siteName: "Pre-IPO Витрина", locale: "ru_RU" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
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

type Book = { slug: string; kicker: string; title: string; desc: string; meta: string };

const BOOKS: Book[] = [
  {
    slug: "do-birzhi",
    kicker: "Книга · Pre-IPO",
    title: "До биржи",
    desc: "Путеводитель инвестора по рынку pre-IPO: история и этапы рынка, методы оценки частных компаний, разбор провалов и взлётов и встраивание pre-IPO в портфельную теорию.",
    meta: "6 частей · 25 глав · 50+ схем · ~200 стр.",
  },
  {
    slug: "razum-mashin",
    kicker: "Учебник · ИИ",
    title: "Разум машин",
    desc: "Полный иллюстрированный учебник об искусственном интеллекте: что это такое, история и этапы развития, как устроено внутри, кто и где создаёт, проблематика и будущее.",
    meta: "6 частей · 40 глав · 80+ схем · ~300 стр.",
  },
];

export default function AcademyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <Link href="/" className="text-sm text-text-muted transition-colors hover:text-text-primary">&larr; На главную</Link>

      <Reveal className="mt-6">
        <p className="kicker kicker-gold">Обучение · Pre-IPO</p>
        <h1 className="text-display mt-2 text-3xl font-bold sm:text-5xl">Академия инвестора</h1>
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

      <Reveal className="mt-14">
        <p className="kicker text-brand">Библиотека</p>
        <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">Книги для глубокого погружения</h2>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Большие иллюстрированные учебники — читайте онлайн или скачивайте PDF. Десятки схем,
          реальные факты, живой язык.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {BOOKS.map((b) => (
            <article key={b.slug} className="overflow-hidden rounded-card border border-border bg-surface shadow-[var(--shadow-card)]">
              <div className="relative aspect-[16/7] overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(700px 320px at 78% -10%, rgba(44,58,168,.55), transparent 60%), radial-gradient(500px 280px at 8% 120%, rgba(14,110,130,.4), transparent 62%), linear-gradient(160deg,#0A0B12,#111427 55%,#0B1220)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <span className="kicker" style={{ color: "#9FB0FF" }}>{b.kicker}</span>
                  <h3 className="text-display text-2xl font-bold text-white sm:text-3xl">{b.title}</h3>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-text-secondary">{b.desc}</p>
                <p className="nums mt-3 text-sm text-text-muted">{b.meta}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={`/books/${b.slug}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-brand rounded-control px-5 py-2.5 text-sm font-semibold"
                  >
                    Читать онлайн →
                  </a>
                  <a
                    href={`/books/${b.slug}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
                  >
                    Скачать PDF
                  </a>
                  <a
                    href={`/books/${b.slug}.epub`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
                  >
                    EPUB
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

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
