// Стартовое наполнение новостей (оригинальные краткие пересказы + источники).
// Идемпотентно по title.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }) });

const CB = "https://news.crunchbase.com/venture/biggest-funding-rounds-june-5-2026/";

const NEWS = [
  {
    title: "Anthropic подал заявку на IPO, оценка приближается к $1 трлн",
    summary:
      "Разработчик ИИ Anthropic официально подал документы для выхода на биржу. Незадолго до этого компания привлекла около $65 млрд в новом раунде, что приблизило её оценку к отметке $1 трлн — одна из крупнейших pre-IPO историй на рынке ИИ.",
    category: "IPO",
    sourceName: "TechCrunch",
    sourceUrl: "https://techcrunch.com/2026/06/01/anthropic-files-to-go-public/",
    publishedAt: new Date("2026-06-01"),
  },
  {
    title: "Ramp привлёк $750 млн при оценке $44 млрд",
    summary:
      "Платформа управления корпоративными расходами Ramp закрыла раунд на $750 млн под лид Iconiq, GIC и Ontario Teachers'. Семилетняя нью-йоркская компания оценена в $44 млрд.",
    category: "Раунд",
    sourceName: "Crunchbase News",
    sourceUrl: CB,
    publishedAt: new Date("2026-06-05"),
  },
  {
    title: "Helion поднял $465 млн на термоядерную энергетику при $15,5 млрд",
    summary:
      "Стартап Helion, строящий первую в мире термоядерную электростанцию, привлёк $465 млн в раунде Series G под лид Thrive Capital. Пост-мани оценка — $15,5 млрд.",
    category: "Раунд",
    sourceName: "Crunchbase News",
    sourceUrl: CB,
    publishedAt: new Date("2026-06-05"),
  },
  {
    title: "Supabase оценён в $10,5 млрд после раунда на $500 млн",
    summary:
      "Open-source платформа для разработчиков и ИИ-приложений Supabase закрыла $500 млн под лид GIC. Оценка шестилетней компании из Сан-Франциско достигла $10,5 млрд.",
    category: "Оценка",
    sourceName: "Crunchbase News",
    sourceUrl: CB,
    publishedAt: new Date("2026-06-04"),
  },
];

(async () => {
  let added = 0;
  for (const n of NEWS) {
    const exists = await prisma.newsItem.findFirst({ where: { title: n.title } });
    if (exists) continue;
    await prisma.newsItem.create({ data: n });
    added++;
  }
  const total = await prisma.newsItem.count();
  console.log(`Новости: добавлено ${added}, всего ${total}`);
  process.exit(0);
})().catch((e) => {
  console.error("Ошибка:", e instanceof Error ? e.message : e);
  process.exit(1);
});
