// Лента новостей pre-IPO в виде газетного выпуска (масштхэд, засечки, колонки,
// линейки). Контент: ИИ-агент (gen-news) + правки оператора. Светлый «бумажный» вид.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pre-IPO Вестник — газета рынка частных компаний",
  description: "Ежедневный выпуск: крупные раунды, оценки и заявки на IPO. Кратко, со ссылками на источники.",
};

export default async function NewsPage() {
  const items = await prisma.newsItem.findMany({
    where: { isActive: true },
    orderBy: [{ isHot: "desc" }, { publishedAt: "desc" }],
    take: 60,
  });
  const [lead, ...rest] = items;

  return (
    <div className="min-h-screen bg-[#f3efe6] text-neutral-900">
      {/* верхняя утилитарная полоса */}
      <div className="border-b border-black/20 bg-[#ebe6da]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2 text-[11px] uppercase tracking-wide">
          <Link href="/" className="font-semibold hover:underline">← На сайт Pre-IPO</Link>
          <span className="text-neutral-600">Информационно · не ИИР</span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-8">
        {/* Масштхэд */}
        <header>
          <p className="border-b-2 border-black pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.25em]">
            Деловая лента · рынок частных компаний
          </p>
          <h1 className="my-2 text-center font-serif text-[clamp(40px,8vw,84px)] font-black leading-none tracking-tight">
            Pre-IPO Вѣстникъ
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-black py-1.5 text-[11px] font-medium uppercase tracking-wide">
            <span>{formatDate(new Date())}</span>
            <span>Ежедневный выпуск</span>
            <span>Цена: бесплатно</span>
          </div>
        </header>

        {items.length === 0 ? (
          <p className="py-16 text-center font-serif text-lg text-neutral-500">Выпуск готовится…</p>
        ) : (
          <>
            {/* Передовица */}
            {lead && (
              <article className="border-b border-black/30 py-7">
                <p className="text-xs font-bold uppercase tracking-wide text-red-800">
                  {lead.category || "Рынок"}{lead.isHot ? " · Срочно в номер" : ""}
                </p>
                <h2 className="mt-1 font-serif text-[clamp(26px,4.5vw,46px)] font-bold leading-[1.1]">{lead.title}</h2>
                <p className="mt-4 font-serif text-[15px] leading-relaxed text-neutral-800 sm:columns-2 sm:gap-8 [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:font-black [&::first-letter]:text-5xl [&::first-letter]:leading-[0.8]">
                  {lead.summary}
                </p>
                <p className="mt-3 text-xs uppercase tracking-wide text-neutral-600">
                  {lead.sourceUrl ? (
                    <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {lead.sourceName || "Источник"} ↗
                    </a>
                  ) : null}
                  {" · "}
                  {formatDate(lead.publishedAt)}
                </p>
              </article>
            )}

            {/* Колонки */}
            {rest.length > 0 && (
              <div className="grid gap-x-7 gap-y-7 py-7 sm:grid-cols-3 sm:divide-x sm:divide-black/15">
                {rest.map((n) => (
                  <article key={n.id} className="sm:px-3.5 sm:first:pl-0 sm:last:pr-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-red-800">
                      {n.category || "Рынок"}{n.isHot ? " · Горячее" : ""}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-bold leading-snug">{n.title}</h3>
                    <p className="mt-2 font-serif text-sm leading-relaxed text-neutral-700">{n.summary}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-neutral-600">
                      {n.sourceUrl ? (
                        <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
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
          </>
        )}

        <footer className="mt-6 border-t-2 border-black pt-3 text-center font-serif text-xs italic text-neutral-600">
          Краткие пересказы подготовлены редакцией; полные тексты — у источников. Материалы носят
          информационный характер и не являются индивидуальной инвестиционной рекомендацией.
        </footer>
      </main>
    </div>
  );
}
