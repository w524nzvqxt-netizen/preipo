// Главная страница — публичная витрина pre-IPO проектов
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContactButtons } from "@/components/ContactButtons";
import { InvestorQuiz } from "@/components/InvestorQuiz";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";
import { ClubSelector } from "@/components/ClubSelector";
import { ProjectCard } from "@/components/ProjectCard";
import { contacts } from "@/lib/config";
import { formatMoney } from "@/lib/format";

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

  // Планеты для солнечной системы в hero: компании по капитализации (оценке)
  const planets = all
    .filter((p) => p.valuation != null)
    .map((p) => ({ name: p.name, cap: p.valuation as number }))
    .sort((a, b) => b.cap - a.cap);

  // Карточки в стиле «выбора клуба FIFA» — общий маппер
  const toClubItem = (p: (typeof all)[number]) => ({
    id: p.id,
    name: p.name,
    sector: [p.sector, p.stage].filter(Boolean).join(" · ") || "Pre-IPO",
    logoUrl: p.logoUrl ?? null,
    valuation: p.valuation != null ? formatMoney(p.valuation) : "—",
    ret: p.expectedReturn != null ? `${Math.round(p.expectedReturn)}%/год` : "—",
    exit: p.expectedExit || "—",
    potential: p.cocMultiple != null ? `×${p.cocMultiple.toFixed(1).replace(".", ",")}` : "—",
    isHot: p.isHot,
  });
  const closedSelectorItems = closedDeals.map(toClubItem);

  // Данные для deal-terminal на первом экране (значения без подтверждения — «по запросу»)
  const terminalDeals = projects.slice(0, 4).map((p) => ({
    name: p.name,
    sector: p.sector || "Late-stage private",
    horizon: p.expectedExit || "2–5 лет",
    minTicket: p.minTicket != null ? formatMoney(p.minTicket, p.currency) : "по запросу",
    status: "доступ ограничен",
    liquidity: "низкая",
    risk: "высокий",
  }));

  // Свежие новости рынка (топ-3 горячих)
  const news = await prisma.newsItem.findMany({
    where: { isActive: true },
    orderBy: [{ isHot: "desc" }, { publishedAt: "desc" }],
    take: 3,
  });

  return (
    <div className="relative bg-bg">
      {/* Тикер котировок — edge-to-edge */}
      <div className="full-bleed border-b border-border bg-surface/50">
        <Ticker />
      </div>

      {/* Стеклянная шапка */}
      <header className="full-bleed sticky top-0 z-50 glass">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-text-primary">
            <span className="text-brand">◆</span> Pre-IPO
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <a href="#deals" className="rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">Сделки</a>
            <a href="#process" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Как это работает</a>
            <a href="#risks" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Риски</a>
            <Link href="/exits" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:block">Аналитика</Link>
            <Link href="/base" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:block">База AI</Link>
            <Link href="/agent" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:block">Партнёрам</Link>
            <a href="#quiz" className="btn-brand ml-1 rounded-control px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm">Получить доступ</a>
          </nav>
        </div>
      </header>

      {/* HERO — full-bleed private deal terminal */}
      <Hero planets={planets} deals={terminalDeals} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-28">
        {/* Баннер индекса vs S&P 500 — наезжает на hero */}
        <Link
          href="/exits"
          className="group relative z-20 -mt-12 block overflow-hidden rounded-card glass p-6 transition-colors hover:border-brand sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="kicker text-text-muted">Аналитика рынка · 21 компания от раунда до IPO</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Трек-рекорд pre-IPO раундов против публичного рынка
              </h2>
              <p className="mt-2 max-w-2xl text-text-secondary">
                Исторически равные вложения в pre-IPO раунды известных компаний — с учётом
                и взлётов, и провалов — опережали S&amp;P 500. Внутри: разбивка по раундам,
                цена акций и калькулятор по точке входа.
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Прошлые результаты не гарантируют будущих.
              </p>
            </div>
            <span className="shrink-0 rounded-control border border-border px-5 py-3 font-semibold text-text-primary transition-colors group-hover:border-brand/50">
              Открыть аналитику →
            </span>
          </div>
        </Link>

        {/* 01 — Видео-объяснялка */}
        <section id="about" className="mt-28">
          <SectionHead n="01" kicker="Pre-IPO: инструкция для инвестора" title="Как это работает" />
          <Reveal className="mt-8">
            <div className="hairline overflow-hidden rounded-card">
              <video
                className="aspect-video w-full bg-surface"
                controls
                preload="metadata"
                playsInline
              >
                <source src="/uploads/home-preipo-video.mp4" type="video/mp4" />
              </video>
            </div>
          </Reveal>
        </section>

        {/* Слоган — full-bleed display */}
        <section className="full-bleed mt-28">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-display text-center text-[clamp(28px,5vw,68px)] font-extrabold leading-[1.05]">
              Лучшие компании мира —
              <br className="hidden sm:block" /> <span className="text-brand">до их выхода на биржу</span>
            </p>
          </div>
        </section>

        {/* Преимущества */}
        <section className="mt-28">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <FeatureCard {...f} index={i} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Как проходит сделка — банковский процесс */}
        <section id="process" className="mt-28 scroll-mt-24">
          <p className="kicker kicker-gold">Процесс</p>
          <h2 className="text-display mt-2 text-2xl font-bold sm:text-4xl">Как проходит сделка</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Прозрачный порядок — от заявки до события ликвидности. На каждом шаге вы видите
            условия, документы и риски до принятия решения.
          </p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((s, i) => (
              <div key={s.title} className="bg-surface p-6">
                <span className="nums text-sm font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-text-primary">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Доступные сделки */}
        <section id="deals" className="mt-28 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead n="02" kicker="Сделки" title="Доступные сделки" />
            <Link
              href="/portfolio"
              className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
            >
              Собрать портфель →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-border p-10 text-center text-text-muted">
              Сделки открываются по запросу. Пройдите подбор — пришлём актуальный список.
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>

        {/* 03 — Закрытые раунды (золотой акцент) */}
        {closedDeals.length > 0 && (
          <section id="track-record" className="mt-28">
            <SectionHead n="03" kicker="Трек-рекорд" title="Закрытые раунды" gold />
            <p className="mt-3 max-w-2xl text-text-secondary">
              Раунды, которые мы уже закрыли для инвесторов. Параметры — на момент входа
              в сделку.
            </p>
            <div className="mt-10">
              <ClubSelector items={closedSelectorItems} />
            </div>
          </section>
        )}

        {/* Новости рынка */}
        {news.length > 0 && (
          <section className="mt-28">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHead n="04" kicker="Лента рынка · ежедневно" title="Новости pre-IPO" />
              <Link
                href="/news"
                className="btn-brand rounded-control px-4 py-2 text-sm font-semibold"
              >
                Все новости →
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {news.map((n) => (
                <Link
                  key={n.id}
                  href="/news"
                  className="card-premium group flex flex-col overflow-hidden rounded-card border border-border bg-surface p-5 hover:-translate-y-1 hover:border-brand/60 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-center gap-2">
                    {n.isHot && (
                      <span className="kicker rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-warning">Горячее</span>
                    )}
                    {n.category && <span className="kicker text-text-muted">{n.category}</span>}
                  </div>
                  <h3 className="mt-3 font-bold leading-tight text-text-primary">{n.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">{n.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Партнёрам — вход в портал */}
        <section className="mt-28">
          <div className="glass relative overflow-hidden rounded-card p-8 sm:p-12">
            <div className="absolute right-[6%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-2xl">
                <p className="kicker kicker-gold">Партнёрская программа</p>
                <h2 className="text-display mt-2 text-2xl font-bold sm:text-4xl">Продавайте pre-IPO своим клиентам</h2>
                <p className="mt-3 text-text-secondary">
                  Личный кабинет партнёра: ведите клиентов и сделки, отслеживайте комиссии и
                  выплаты, считайте доходность и рентабельность портфеля, формируйте отчёты —
                  на сайте и в Telegram-боте.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-text-muted">
                  <span className="hairline rounded-control px-3 py-1.5">Клиенты и сделки</span>
                  <span className="hairline rounded-control px-3 py-1.5">Комиссии и SF</span>
                  <span className="hairline rounded-control px-3 py-1.5">Доходность vs S&amp;P 500</span>
                  <span className="hairline rounded-control px-3 py-1.5">Отчёты PDF</span>
                </div>
              </div>
              <Link
                href="/agent"
                className="btn-brand shrink-0 rounded-control px-7 py-3.5 font-semibold"
              >
                Войти в кабинет →
              </Link>
            </div>
          </div>
        </section>

        {/* Сравнение инструментов */}
        <section id="compare" className="mt-28 scroll-mt-24">
          <p className="kicker kicker-gold">Контекст</p>
          <h2 className="text-display mt-2 text-2xl font-bold sm:text-4xl">Где Pre-IPO среди других инструментов</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Честное место инструмента: высокий потенциал — но низкая ликвидность и длинный
            горизонт. Pre-IPO дополняет портфель, а не заменяет его.
          </p>
          <div className="mt-8 overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-alt text-left">
                  {["Инструмент", "Потенциал", "Риск", "Ликвидность", "Чек", "Горизонт"].map((h) => (
                    <th key={h} className="kicker px-4 py-3 font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Публичные акции", p: "средний", r: "средний", l: "высокая", c: "низкий", h: "любой" },
                  { name: "IPO", p: "высокий", r: "высокий", l: "средняя", c: "средний", h: "6–24 мес" },
                  { name: "Pre-IPO", p: "высокий", r: "высокий", l: "низкая", c: "высокий", h: "2–5 лет", hl: true },
                  { name: "Венчур", p: "очень высокий", r: "очень высокий", l: "очень низкая", c: "высокий", h: "5–10 лет" },
                ].map((row) => (
                  <tr key={row.name} className={`border-t border-border ${row.hl ? "bg-brand-subtle" : "bg-surface"}`}>
                    <td className={`px-4 py-3 font-semibold ${row.hl ? "text-brand" : "text-text-primary"}`}>{row.name}</td>
                    <td className="nums px-4 py-3 text-text-secondary">{row.p}</td>
                    <td className="nums px-4 py-3 text-text-secondary">{row.r}</td>
                    <td className="nums px-4 py-3 text-text-secondary">{row.l}</td>
                    <td className="nums px-4 py-3 text-text-secondary">{row.c}</td>
                    <td className="nums px-4 py-3 text-text-secondary">{row.h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Риски — amber, без красного «ужаса» */}
        <section id="risks" className="mt-28 scroll-mt-24">
          <p className="kicker text-warning">Важно понимать</p>
          <h2 className="text-display mt-2 text-2xl font-bold sm:text-4xl">Риски Pre-IPO</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Мы не продаём мечту, а открываем доступ к сложному инструменту и честно
            показываем условия. Pre-IPO предполагает повышенный риск.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Низкая ликвидность", d: "Продать долю до IPO может быть сложно." },
              { t: "Нет гарантии IPO", d: "Компания может отложить выход на биржу или не выйти вовсе." },
              { t: "Высокий риск", d: "Стоимость актива может снизиться, возможна полная потеря капитала." },
              { t: "Долгий горизонт", d: "Не подходит для денег, которые могут понадобиться в ближайшие месяцы." },
              { t: "Ограниченная информация", d: "Частные компании раскрывают меньше данных, чем публичные." },
              { t: "Сложная структура сделки", d: "SPV, опционы, фонды и secondary требуют понимания документов." },
            ].map((r) => (
              <div key={r.t} className="rounded-card border border-warning/25 border-l-2 border-l-warning bg-warning/5 p-6">
                <h3 className="font-semibold text-text-primary">{r.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Для кого подходит / не подходит */}
        <section className="mt-20 grid gap-5 md:grid-cols-2">
          <div className="rounded-card border border-positive/25 bg-positive/[0.06] p-6 sm:p-8">
            <p className="kicker text-positive">Подходит</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
              {[
                "Квалифицированным инвесторам",
                "Тем, кто готов к горизонту 2–5 лет",
                "Тем, кто понимает риск private equity",
                "Кто хочет диверсификацию вне публичного рынка",
              ].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <span className="mt-0.5 text-positive">✓</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-warning/25 bg-warning/[0.05] p-6 sm:p-8">
            <p className="kicker text-warning">Не подходит</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
              {[
                "Если нужны гарантии доходности",
                "Если деньги могут понадобиться через 3–6 месяцев",
                "Если вы не готовы к полной потере капитала",
                "Если вы хотите «быстрые иксы»",
              ].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <span className="mt-0.5 text-warning">—</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Подбор сделок — квиз вместо обычной формы */}
        <section id="quiz" className="mt-28 scroll-mt-24">
          <Reveal>
            <div className="hairline overflow-hidden rounded-card">
              <div className="grid sm:grid-cols-2">
                <div className="p-8 sm:p-10">
                  <p className="kicker kicker-gold">Подбор сделок</p>
                  <h2 className="text-display mt-2 text-2xl font-bold sm:text-4xl">
                    Подберём сделки под ваш профиль
                  </h2>
                  <p className="mt-4 max-w-md text-text-secondary">
                    Ответьте на 4 вопроса — пришлём 3–5 подходящих сделок, условия входа и
                    документы. Или свяжитесь напрямую.
                  </p>
                  <div className="mt-6">
                    <ContactButtons />
                  </div>
                  <p className="mt-6 max-w-md text-xs leading-relaxed text-text-muted">
                    Только для квалифицированных инвесторов. Информация на сайте не является
                    индивидуальной инвестиционной рекомендацией.
                  </p>
                </div>
                <div className="island p-8 sm:p-10">
                  <InvestorQuiz />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="mt-20 border-t border-border pt-8 text-sm">
          <Disclaimer />
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-text-muted">
            <span className="nums">© {new Date().getFullYear()} Pre-IPO Витрина</span>
            <Link href="/privacy" className="text-text-muted underline hover:text-text-secondary">
              Политика обработки персональных данных
            </Link>
            <Link href="/news" className="text-text-muted underline hover:text-text-secondary">Новости</Link>
            <Link href="/agent" className="text-text-muted underline hover:text-text-secondary">Партнёрам</Link>
          </div>
        </footer>
      </main>

      {/* Липкий мобильный CTA */}
      <div className="glass fixed inset-x-0 bottom-0 z-50 p-3 sm:hidden">
        <div className="flex gap-2">
          <a
            href="#quiz"
            className="btn-brand flex-1 rounded-control py-3 text-center font-semibold"
          >
            Получить список сделок
          </a>
          {contacts.telegram && (
            <a
              href={contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="hairline rounded-control px-5 py-3 text-center font-semibold text-text-primary"
            >
              Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHead({
  n,
  kicker,
  title,
  gold,
}: {
  n: string;
  kicker: string;
  title: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-end gap-4">
      <span
        aria-hidden="true"
        className="nums text-[clamp(32px,5vw,72px)] font-extrabold leading-none text-border-strong"
      >
        {n}
      </span>
      <div className="pb-1">
        <p className={`kicker ${gold ? "kicker-gold" : "text-text-muted"}`}>{kicker}</p>
        <h2 className="text-display mt-1 text-2xl font-bold sm:text-4xl">{title}</h2>
      </div>
    </div>
  );
}

// Шаги сделки — спокойный банковский процесс
const PROCESS: { title: string; text: string }[] = [
  { title: "Заявка", text: "Оставляете заявку или проходите короткий подбор сделок." },
  { title: "Проверка профиля инвестора", text: "Подтверждаем статус и соответствие требованиям к инвестору." },
  { title: "Подбор доступных сделок", text: "Показываем сделки под ваш профиль, горизонт и сектор." },
  { title: "Раскрытие условий и рисков", text: "Структура входа, deal memo, риски и документы — до решения." },
  { title: "Документы и оплата", text: "Согласуем объём, подписываем документы, проводим оплату." },
  { title: "Сопровождение до выхода", text: "Отчётность и поддержка до IPO, secondary или M&A." },
];

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
      className={`card-premium group h-full overflow-hidden rounded-card border border-border border-l-4 bg-surface p-6 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0 ${borderAccent}`}
    >
      <p className="kicker mb-3 text-text-muted">{num}</p>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}
