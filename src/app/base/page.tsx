// Раздел «База»: pre-IPO AI-компании за последний год с разбором и графиком оценки.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ValuationSpark, type Round } from "@/components/ValuationChart";
import { Reveal } from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "База pre-IPO AI-компаний — оценки, раунды, разбор",
  description: "Частные лидеры ИИ за последний год: бизнес, планы, оценки по раундам и инвест-разбор. Без хайпа.",
};

const SEG_ORDER = ["Foundation & LLM", "Physical AI & Robotics", "AI-инфраструктура", "AI-приложения", "AI для науки"];

function parseRounds(s?: string | null): Round[] {
  try { return JSON.parse(s ?? "[]") as Round[]; } catch { return []; }
}

export default async function BasePage() {
  const companies = await prisma.kbCompany.findMany({
    where: { isActive: true },
    orderBy: [{ valuationUSD: "desc" }],
  });

  const bySeg = new Map<string, typeof companies>();
  for (const c of companies) {
    const k = c.segment || "Прочее";
    if (!bySeg.has(k)) bySeg.set(k, []);
    bySeg.get(k)!.push(c);
  }
  const segs = [...bySeg.keys()].sort((a, b) => {
    const ia = SEG_ORDER.indexOf(a), ib = SEG_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <Link href="/" className="text-sm text-text-muted transition-colors hover:text-text-primary">&larr; На главную</Link>

      <Reveal className="mt-6">
        <p className="kicker text-brand">База · Pre-IPO AI</p>
        <h1 className="mt-2 text-3xl font-bold text-text-primary sm:text-4xl">
          Частные лидеры ИИ за последний год
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          {companies.length} компаний, которые ещё не вышли на биржу: чем занимаются, куда идут,
          как менялась оценка по раундам и наш разбор — без хайпа и «иксов».
        </p>
      </Reveal>

      {segs.map((seg) => (
        <section key={seg} className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-text-primary">{seg}</h2>
            <span className="kicker text-text-muted">{bySeg.get(seg)!.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bySeg.get(seg)!.map((c) => (
              <Link
                key={c.id}
                href={`/base/${c.id}`}
                className="card-premium group flex h-full flex-col rounded-card border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-brand/50 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt={c.name} className="h-9 w-9 shrink-0 rounded-control border border-border bg-surface object-contain p-1" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-alt text-sm font-bold text-text-muted">{c.name.charAt(0)}</div>
                    )}
                    <h3 className="truncate font-semibold text-text-primary">{c.name}</h3>
                  </div>
                  {c.valuationLabel && (
                    <span className="nums shrink-0 text-sm font-semibold text-brand">{c.valuationLabel}</span>
                  )}
                </div>

                {c.oneLiner && <p className="mt-3 line-clamp-2 text-sm text-text-secondary">{c.oneLiner}</p>}

                <div className="mt-auto flex items-end justify-between pt-4">
                  <span className="text-xs text-text-muted">{c.founded ? `с ${c.founded}` : ""}</span>
                  <ValuationSpark rounds={parseRounds(c.rounds)} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-14 text-xs text-text-muted">
        Данные — по публичным сообщениям о раундах, на дату сбора. Информация, не является индивидуальной инвестиционной рекомендацией.
      </p>
    </main>
  );
}
