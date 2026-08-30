// Карточка компании базы: разбор (бизнес, планы, риски) + график оценки по раундам.
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ValuationChart, type Round } from "@/components/ValuationChart";
import { Reveal } from "@/components/motion/Reveal";
import { Disclaimer } from "@/components/Disclaimer";

export const dynamic = "force-dynamic";

function parseRounds(s?: string | null): Round[] {
  try { return JSON.parse(s ?? "[]") as Round[]; } catch { return []; }
}

export default async function BaseCompany({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.kbCompany.findUnique({ where: { id } });
  if (!c || !c.isActive) notFound();
  const rounds = parseRounds(c.rounds);
  const validRounds = rounds.filter((r) => r.valuationUSD != null && r.valuationUSD > 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <Link href="/base" className="text-sm text-text-muted transition-colors hover:text-text-primary">&larr; Вся база</Link>

      {/* Шапка */}
      <Reveal className="mt-6">
        <div className="flex flex-wrap items-start gap-4">
          {c.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.logoUrl} alt={c.name} className="h-16 w-16 rounded-card border border-border bg-white object-contain p-2 shadow-[var(--shadow-card)]" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-card bg-surface-alt text-2xl font-bold text-text-muted">{c.name.charAt(0)}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{c.name}</h1>
              {c.segment && <span className="kicker rounded-pill border border-border bg-surface-alt px-2.5 py-1 text-text-muted">{c.segment}</span>}
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {[c.founded ? `основана ${c.founded}` : null, c.website].filter(Boolean).join(" · ")}
            </p>
          </div>
          {c.valuationLabel && (
            <div className="text-right">
              <p className="kicker text-text-muted">Оценка</p>
              <p className="nums text-2xl font-bold text-brand">{c.valuationLabel}</p>
            </div>
          )}
        </div>
        {c.oneLiner && <p className="mt-5 text-lg text-text-secondary">{c.oneLiner}</p>}
        {c.lastNews && (
          <p className="mt-3 text-sm text-text-muted">
            📰{" "}
            {c.lastNewsUrl ? (
              <a href={c.lastNewsUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{c.lastNews}</a>
            ) : (
              <span className="text-text-secondary">{c.lastNews}</span>
            )}
          </p>
        )}
      </Reveal>

      {/* График оценки по раундам */}
      {validRounds.length >= 2 && (
        <Section kicker="Оценка" title="Переоценка по раундам">
          <div className="rounded-card border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <ValuationChart rounds={rounds} />
          </div>
        </Section>
      )}
      {(c.lastRound || c.nextRound) && (
        <Section kicker="Раунды" title="Раунды и намерения">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
            {c.lastRound && <p className="text-text-muted">Последний раунд: <span className="text-text-secondary">{c.lastRound}</span></p>}
            {c.nextRound && <p className="text-text-muted">Намерения: <span className="text-brand">{c.nextRound}</span></p>}
          </div>
        </Section>
      )}

      {c.business && <Section kicker="Бизнес" title="Чем занимается"><Para text={c.business} /></Section>}
      {c.plans && <Section kicker="Перспектива" title="Планы и выход"><Para text={c.plans} /></Section>}
      {c.analysis && (
        <Section kicker="Разбор" title="Инвест-взгляд">
          <div className="rounded-card border border-border bg-surface p-5">
            <p className="leading-relaxed text-text-secondary">{c.analysis}</p>
          </div>
        </Section>
      )}

      {c.sourceUrl && (
        <p className="mt-8 text-sm text-text-muted">
          Источник:{" "}
          <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
            {c.sourceName || "ссылка"} ↗
          </a>
        </p>
      )}

      <div className="mt-10 flex justify-center">
        <Link href="/base" className="rounded-control border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand">
          &larr; Вся база
        </Link>
      </div>

      <footer className="mt-12 border-t border-border pt-6">
        <Disclaimer />
      </footer>
    </main>
  );
}

function Section({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal className="mt-10">
      <div className="mb-3">
        <p className="kicker text-text-muted">{kicker}</p>
        <h2 className="mt-0.5 text-xl font-bold text-text-primary">{title}</h2>
      </div>
      {children}
    </Reveal>
  );
}

function Para({ text }: { text: string }) {
  return <p className="whitespace-pre-line leading-relaxed text-text-secondary">{text}</p>;
}
