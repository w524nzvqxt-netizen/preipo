// ИИ-агент новостей: через веб-поиск Claude находит свежие pre-IPO новости и
// делает ОРИГИНАЛЬНЫЕ краткие пересказы (не копии статей) + ссылки на источники.
// Запуск (вручную или по расписанию раз в день): npx tsx prisma/gen-news.ts
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// .env (standalone-скрипт сам не грузит)
try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("Нет ANTHROPIC_API_KEY в .env");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }) });
const anthropic = new Anthropic({ apiKey: key });

const PROMPT = `Ты — новостной редактор раздела pre-IPO. Найди через веб-поиск 2–3 САМЫЕ ГОРЯЧИЕ и свежие (за последние дни) новости по теме pre-IPO: крупные раунды известных частных компаний, новые оценки, заявки на IPO, вторичные сделки, заметные выходы.

Требования:
- Пиши на русском.
- summary — ОРИГИНАЛЬНЫЙ краткий пересказ своими словами, 2–4 предложения. НЕ копируй текст статей, не цитируй дословно.
- Для каждой новости укажи проверяемый источник (название и URL).
- Только реальные новости из результатов поиска. Не выдумывай.

Верни СТРОГО JSON-массив без markdown, формат:
[{"title":"...","summary":"...","category":"IPO|Раунд|Оценка|Рынок","sourceName":"...","sourceUrl":"https://..."}]`;

type Item = { title: string; summary: string; category?: string; sourceName?: string; sourceUrl?: string };

(async () => {
  const resp = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2500,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 } as never],
    messages: [{ role: "user", content: PROMPT }],
  });

  const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error("Не удалось извлечь JSON из ответа модели:\n", text.slice(0, 500));
    process.exit(1);
  }
  const items = JSON.parse(match[0]) as Item[];

  let added = 0;
  for (const n of items.slice(0, 3)) {
    if (!n.title || !n.summary) continue;
    const exists = await prisma.newsItem.findFirst({ where: { title: n.title } });
    if (exists) continue;
    await prisma.newsItem.create({
      data: {
        title: n.title,
        summary: n.summary,
        category: n.category ?? null,
        sourceName: n.sourceName ?? null,
        sourceUrl: n.sourceUrl ?? null,
        isHot: true,
      },
    });
    added++;
    console.log("＋", n.title);
  }
  console.log(`Готово: добавлено ${added}, всего ${await prisma.newsItem.count()}`);
  process.exit(0);
})().catch((e) => {
  console.error("Ошибка ИИ-новостей:", e instanceof Error ? e.message : e);
  process.exit(1);
});
