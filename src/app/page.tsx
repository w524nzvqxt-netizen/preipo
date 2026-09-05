// Главная страница — публичная витрина pre-IPO проектов
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContactButtons } from "@/components/ContactButtons";
import { InvestorQuiz } from "@/components/InvestorQuiz";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";
import { MobileNav } from "@/components/MobileNav";
import { contacts } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import type { Project } from "@/generated/prisma/client";

// Витрина всегда отражает актуальные данные из админки
// ISR: страница кэшируется и переgenerируется не чаще раза в 5 минут.
// Даёт мгновенный TTFB и устойчивость к холодному старту (иначе Lighthouse
// на «спящем» Railway ловит таймаут — «страница не отвечает»). Контент в dev.db
// меняется через админку и подхватывается в течение интервала / при деплое.
export const revalidate = 300;

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

  // Bento-витрина: спотлайт горячей сделки + прочие открытые + трек-рекорд
  const spotlight = projects[0] ?? null;
  const openRest = projects.slice(1);
  const bestCoc = closedDeals.reduce(
    (m, p) => (p.cocMultiple != null && p.cocMultiple > m ? p.cocMultiple : m),
    0
  );
  const bestMultiple = bestCoc > 0 ? `×${bestCoc.toFixed(1).replace(".", ",")}` : null;

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
          <nav aria-label="Основная навигация" className="flex items-center gap-0.5 sm:gap-1">
            <a href="#deals" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Сделки</a>
            <a href="#process" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Как это работает</a>
            <a href="#risks" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Риски</a>
            <Link href="/exits" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Аналитика</Link>
            <Link href="/base" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Будущие гиганты</Link>
            <Link href="/academy" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Академия</Link>
            <Link href="/agent" className="hidden rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary lg:block">Партнёрам</Link>
            <a href="#quiz" className="btn-brand ml-1 rounded-control px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm">Получить доступ</a>
            <MobileNav />
          </nav>
        </div>
      </header>

      {/* HERO — full-bleed private deal terminal */}
      <Hero planets={planets} deals={terminalDeals} />

      <main id="main" className="mx-auto w-full max-w-7xl px-6 pb-28">
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
                poster="/uploads/poster-main.jpg"
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

        {/* 02 — Bento-витрина: открытые сделки, трек-рекорд, новости */}
        <section id="deals" className="mt-28 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead n="02" kicker="Витрина" title="Сделки и трек-рекорд" />
            <Link
              href="/portfolio"
              className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
            >
              Собрать портфель →
            </Link>
          </div>

          <div className="mt-10 grid grid-flow-row-dense grid-cols-2 gap-4 [grid-auto-rows:minmax(150px,auto)] lg:grid-cols-4">
            {/* Спотлайт горячей открытой сделки */}
            {spotlight && (
              <Link
                href={`/project/${spotlight.id}`}
                className="card-premium group relative col-span-2 row-span-2 flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-6 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
              >
                <div className="pointer-events-none absolute right-[-20%] top-[-30%] h-64 w-64 rounded-full bg-brand/10 blur-[100px]" />
                <div className="relative flex items-center justify-between gap-3">
                  <p className="kicker kicker-gold">
                    {spotlight.isHot ? "Горячая сделка" : "Открытая сделка"}
                    {spotlight.sector ? ` · ${spotlight.sector}` : ""}
                  </p>
                  <span className="kicker shrink-0 rounded-pill border border-brand/40 bg-brand-subtle px-2.5 py-1 text-brand">
                    Доступно
                  </span>
                </div>
                <div className="relative">
                  <h3 className="text-display text-3xl font-bold sm:text-4xl">{spotlight.name}</h3>
                  <p className="mt-2 text-text-secondary">
                    {[spotlight.sector, spotlight.stage].filter(Boolean).join(" · ") || "Late-stage private"}
                  </p>
                </div>
                <div className="relative">
                  <p className="kicker text-text-muted">Оценка входа</p>
                  <p className="nums text-3xl font-extrabold text-text-primary sm:text-4xl">
                    {formatMoney(spotlight.valuation)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4">
                    <Stat k="Доходность" v={spotlight.expectedReturn != null ? `+${Math.round(spotlight.expectedReturn)}%/год` : "—"} pos />
                    <Stat k="Прогноз выхода" v={spotlight.expectedExit || "—"} />
                    <Stat k="Мин. чек" v={spotlight.minTicket != null ? formatMoney(spotlight.minTicket, spotlight.currency) : "по запросу"} />
                  </div>
                </div>
              </Link>
            )}

            {/* Новости рынка — большой тайл */}
            {news.length > 0 && (
              <div className="col-span-2 row-span-2 flex flex-col overflow-hidden rounded-card border border-border bg-surface p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="kicker text-text-muted">Лента рынка · ежедневно</p>
                  <Link href="/news" className="text-sm font-semibold text-brand hover:underline">Все →</Link>
                </div>
                <div className="mt-1 flex flex-col divide-y divide-border">
                  {news.map((n) => (
                    <Link key={n.id} href="/news" className="group flex flex-col gap-1.5 py-3.5">
                      <div className="flex items-center gap-2">
                        {n.isHot && (
                          <span className="kicker rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-warning">Горячее</span>
                        )}
                        {n.category && <span className="kicker text-text-muted">{n.category}</span>}
                      </div>
                      <h3 className="font-semibold leading-tight text-text-primary transition-colors group-hover:text-brand">{n.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Прочие открытые сделки */}
            {openRest.map((p) => (
              <BentoDeal key={p.id} p={p} />
            ))}

            {/* Трек-рекорд — закрытые раунды */}
            {closedDeals.map((p) => (
              <BentoClosed key={p.id} p={p} />
            ))}

            {/* База — будущие гиганты */}
            <Link
              href="/base"
              className="card-premium group col-span-2 flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-6 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
            >
              <div>
                <p className="kicker kicker-gold">Будущие гиганты</p>
                <h3 className="mt-2 text-xl font-bold text-text-primary">База частных компаний</h3>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Оценки, раунды и разборы десятков pre-IPO компаний по секторам.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                Открыть базу
                <span className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none">→</span>
              </span>
            </Link>

            {/* Статы витрины */}
            <div className="flex flex-col justify-center gap-3.5 rounded-card border border-border bg-surface-alt p-6">
              <Stat k="Открытых сделок" v={String(projects.length)} big />
              <Stat k="Закрытых раундов" v={String(closedDeals.length)} big />
              {bestMultiple && <Stat k="Лучший результат" v={bestMultiple} big gold />}
            </div>

            {/* CTA — подбор */}
            <a
              href="#quiz"
              className="btn-brand flex flex-col justify-between rounded-card p-6 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
            >
              <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Подбор</span>
              <span className="mt-6 text-lg font-bold leading-tight">Получить список сделок →</span>
            </a>
          </div>
        </section>

        {/* Партнёрам — вход в портал */}
        <section className="mt-28">
          <div className="glass relative overflow-hidden rounded-card p-8 sm:p-12">
            <div className="absolute right-[6%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-2xl">
                <p className="kicker kicker-gold">Партнёрская программа</p>
                <h2 className="text-display mt-2 text-2xl font-bold sm:text-4xl">Дайте своим клиентам доступ к pre-IPO</h2>
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
      <div className="glass fixed inset-x-0 bottom-0 z-50 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
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

// Мелкий стат-блок (лейбл + значение) для bento-тайлов
function Stat({
  k,
  v,
  pos,
  gold,
  big,
}: {
  k: string;
  v: string;
  pos?: boolean;
  gold?: boolean;
  big?: boolean;
}) {
  return (
    <div>
      <p className="kicker text-text-muted">{k}</p>
      <p
        className={`nums font-bold ${big ? "text-2xl" : "text-base"} ${
          pos ? "text-positive" : gold ? "text-brand" : "text-text-primary"
        }`}
      >
        {v}
      </p>
    </div>
  );
}

// Открытая сделка — компактный bento-тайл
function BentoDeal({ p }: { p: Project }) {
  return (
    <Link
      href={`/project/${p.id}`}
      className="card-premium group flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-5 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight text-text-primary">{p.name}</h3>
        <span className="kicker shrink-0 rounded-pill border border-brand/40 bg-brand-subtle px-2 py-0.5 text-brand">Доступно</span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{p.sector || "Late-stage private"}</p>
      <div className="mt-3 border-t border-border pt-3">
        <p className="nums text-lg font-extrabold text-text-primary">{formatMoney(p.valuation)}</p>
        <p className="nums mt-0.5 text-xs text-text-secondary">
          {p.expectedReturn != null ? `+${Math.round(p.expectedReturn)}%/год` : "—"}
          {p.expectedExit ? ` · ${p.expectedExit}` : ""}
        </p>
      </div>
    </Link>
  );
}

// Закрытый раунд (трек-рекорд) — компактный bento-тайл с множителем
function BentoClosed({ p }: { p: Project }) {
  const mult = p.cocMultiple != null ? `×${p.cocMultiple.toFixed(1).replace(".", ",")}` : null;
  return (
    <Link
      href={`/project/${p.id}`}
      className="card-premium group flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-5 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight text-text-primary">{p.name}</h3>
        <span className="kicker shrink-0 rounded-pill border border-border bg-surface-alt px-2 py-0.5 text-text-muted">Закрыто</span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{p.sector || "Late-stage private"}</p>
      <div className="mt-3 flex items-end justify-between gap-2 border-t border-border pt-3">
        <div>
          <p className="kicker text-text-muted">Оценка</p>
          <p className="nums text-base font-bold text-text-primary">{formatMoney(p.valuation)}</p>
        </div>
        {mult && <span className="nums text-xl font-extrabold text-brand">{mult}</span>}
      </div>
    </Link>
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
