// Главная страница — публичная витрина pre-IPO проектов
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContactButtons } from "@/components/ContactButtons";
import { LeadForm } from "@/components/LeadForm";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";
import { ClubSelector } from "@/components/ClubSelector";
import { contacts } from "@/lib/config";
import { computeExitIndex, TICKET } from "@/lib/exit-index";
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

  // Индекс трек-рекорда (вышедшие на биржу компании)
  const publicRows = await prisma.publicCompany.findMany();
  const idx = computeExitIndex(
    publicRows.map((r) => {
      let rounds: { valuationUSD: number | null; year: number | null }[] = [];
      try {
        rounds = (JSON.parse(r.rounds ?? "[]") as { valuationUSD?: number | null; year?: number | null }[]).map(
          (x) => ({ valuationUSD: x.valuationUSD ?? null, year: x.year ?? null })
        );
      } catch {
        rounds = [];
      }
      return { currentMarketCapUSD: r.currentMarketCapUSD, rounds };
    })
  );
  const outperform = idx.sp500Mult > 0 ? idx.preIpoMult / idx.sp500Mult : 0;

  // KPI для hero
  const withReturn = all.filter((p) => p.expectedReturn != null);
  const avgReturn = withReturn.length
    ? Math.round(
        withReturn.reduce((s, p) => s + (p.expectedReturn ?? 0), 0) /
          withReturn.length
      )
    : 0;

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
  const selectorItems = projects.map(toClubItem);
  const closedSelectorItems = closedDeals.map(toClubItem);

  return (
    <div className="relative bg-bg">
      {/* Тикер котировок — edge-to-edge */}
      <div className="full-bleed border-b border-border bg-surface/50">
        <Ticker />
      </div>

      {/* Стеклянная шапка */}
      <header className="full-bleed sticky top-0 z-50 glass">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <span className="text-brand">◆</span> Pre-IPO
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/exits"
              className="rounded-control border border-border bg-surface/70 px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand hover:text-brand sm:px-4 sm:text-sm"
            >
              📈 Уже на бирже
            </Link>
            <Link
              href="/portfolio"
              className="rounded-control border border-brand/50 bg-brand-subtle px-3 py-2 text-xs font-semibold text-brand transition-all hover:border-brand hover:brightness-110 sm:px-4 sm:text-sm"
            >
              📊 Портфель
            </Link>
            <div className="hidden sm:block">
              <ContactButtons size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* HERO — full-bleed обсерватория */}
      <Hero dealCount={all.length} closedCount={closedDeals.length} avgReturn={avgReturn} planets={planets} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-28">
        {/* Баннер индекса vs S&P 500 — наезжает на hero */}
        <Link
          href="/exits"
          className="group relative z-20 -mt-12 block overflow-hidden rounded-card glass p-6 transition-colors hover:border-brand sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="kicker kicker-gold">Трек-рекорд рынка · 21 компания от раунда до IPO</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                {formatMoney(TICKET)} в каждый раунд →{" "}
                <span className="nums text-positive">×{idx.preIpoMult.toFixed(1).replace(".", ",")}</span>
                <span className="nums ml-2 text-lg font-semibold text-text-muted">
                  vs S&amp;P 500 ×{idx.sp500Mult.toFixed(1).replace(".", ",")}
                </span>
              </h2>
              <p className="mt-2 max-w-2xl text-text-secondary">
                Pre-IPO раунды известных компаний (и взлёты, и провалы) опередили бы
                S&amp;P 500 примерно в{" "}
                <b className="text-brand">{outperform.toFixed(1).replace(".", ",")}×</b>. Разбивка по
                раундам, цена акций и калькулятор по точке входа.
              </p>
            </div>
            <span className="glow-brand shrink-0 rounded-control bg-brand px-5 py-3 font-semibold text-bg transition-all group-hover:brightness-110">
              Смотреть трек-рекорд →
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
                poster="/uploads/poster-main.jpg"
              >
                <source src="/uploads/main-pre-ipo.mp4" type="video/mp4" />
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

        {/* 02 — Открытые раунды */}
        <section id="projects" className="mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead n="02" kicker="Витрина" title="Доступные проекты" />
            <Link
              href="/portfolio"
              className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-bg transition-all hover:brightness-110"
            >
              Собрать портфель →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-border p-10 text-center text-text-muted">
              Пока нет активных проектов.
            </div>
          ) : (
            <div className="mt-10">
              <ClubSelector items={selectorItems} />
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

        {/* 04 — Контакт: тёмная панель + светлый остров с формой */}
        <section id="contact" className="mt-28">
          <Reveal>
            <div className="hairline overflow-hidden rounded-card">
              <div className="grid sm:grid-cols-2">
                <div className="p-8 sm:p-10">
                  <SectionHead n="04" kicker="Связаться" title="Войдите в сделку" />
                  <p className="mt-4 max-w-md text-text-secondary">
                    Оставьте заявку или напишите напрямую — ответим и подберём проект под
                    ваши задачи.
                  </p>
                  <div className="mt-6">
                    <ContactButtons />
                  </div>
                </div>
                <div className="island p-8 sm:p-10">
                  <p className="kicker mb-4 text-text-muted">Оставить заявку</p>
                  <LeadForm />
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
          </div>
        </footer>
      </main>

      {/* Липкий мобильный CTA */}
      <div className="glass fixed inset-x-0 bottom-0 z-50 p-3 sm:hidden">
        <div className="flex gap-2">
          <a
            href="#contact"
            className="glow-brand flex-1 rounded-control bg-brand py-3 text-center font-semibold text-bg"
          >
            Оставить заявку
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
      className={`group h-full rounded-card border border-border border-l-4 bg-surface p-6 transition-colors hover:border-brand ${borderAccent}`}
    >
      <p className="kicker mb-3 text-text-muted">{num}</p>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}
