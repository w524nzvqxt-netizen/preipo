// Лента новостей pre-IPO в bento-стиле сайта (тёмная тема, золотой акцент).
// Контент: ИИ-агент (gen-news) + правки оператора.
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const revalidate = 300; // ISR: кэш 5 мин, быстрый TTFB, устойчивость к холодному старту

const TITLE = "Pre-IPO Вестник — новости рынка частных компаний";
const DESC = "Ежедневный выпуск: крупные раунды, оценки и заявки на IPO. Кратко, со ссылками на источники.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/news" },
  openGraph: { type: "website", title: TITLE, description: DESC, url: "/news", siteName: "Pre-IPO Витрина", locale: "ru_RU" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default async function NewsPage() {
  const items = await prisma.newsItem.findMany({
    where: { isActive: true },
    orderBy: [{ isHot: "desc" }, { publishedAt: "desc" }],
    take: 60,
  });
  const [lead, ...rest] = items;

  return (
    <div className="bg-bg">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
        <Link href="/" className="text-sm text-text-muted transition-colors hover:text-text-primary">&larr; На главную</Link>

        <div className="mt-6">
          <p className="kicker kicker-gold">Вестник pre-IPO · ежедневно</p>
          <h1 className="text-display mt-2 text-3xl font-bold sm:text-5xl">Вестник pre-IPO</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Крупные раунды, новые оценки и заявки на IPO — кратко и со ссылками на источники.
            Обновляется каждый день · {formatDate(new Date())}.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="mt-16 text-center text-text-muted">Выпуск готовится…</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Передовица — крупный тайл */}
            {lead && (
              <article className="card-premium rounded-card border border-border bg-surface p-6 sm:p-8 lg:col-span-3">
                <div className="flex items-center gap-2">
                  {lead.isHot && (
                    <span className="kicker rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-warning">Срочно в номер</span>
                  )}
                  <span className="kicker text-text-muted">{lead.category || "Рынок"}</span>
                </div>
                <h2 className="text-display mt-3 text-2xl font-bold sm:text-4xl">{lead.title}</h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{lead.summary}</p>
                <p className="kicker mt-4 text-text-muted">
                  {lead.sourceUrl ? (
                    <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      {lead.sourceName || "Источник"} ↗
                    </a>
                  ) : (
                    lead.sourceName
                  )}
                  {" · "}
                  {formatDate(lead.publishedAt)}
                </p>
              </article>
            )}

            {/* Остальные новости — сетка тайлов */}
            {rest.map((n) => (
              <article
                key={n.id}
                className="card-premium flex flex-col rounded-card border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-brand/50 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-center gap-2">
                  {n.isHot && (
                    <span className="kicker rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-warning">Горячее</span>
                  )}
                  <span className="kicker text-text-muted">{n.category || "Рынок"}</span>
                </div>
                <h3 className="mt-3 font-bold leading-snug text-text-primary">{n.title}</h3>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-text-secondary">{n.summary}</p>
                <p className="kicker mt-auto pt-3 text-text-muted">
                  {n.sourceUrl ? (
                    <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      {n.sourceName || "Источник"} ↗
                    </a>
                  ) : (
                    formatDate(n.publishedAt)
                  )}
                </p>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-14 border-t border-border pt-6 text-sm text-text-muted">
          Краткие пересказы подготовлены редакцией; полные тексты — у источников. Материалы носят
          информационный характер и не являются индивидуальной инвестиционной рекомендацией.
        </footer>
      </div>
    </div>
  );
}
