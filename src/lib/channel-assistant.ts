// AI-ассистент по Telegram-каналу @preipopro для владельца.
// Отвечает на вопросы про канал: план постов, идеи контента, что в витрине/новостях,
// тексты анонсов. Тон: private banking, без хайпа и «иксов». Работает на claude-opus-4-8.
import Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "../generated/prisma/client";

const MODEL = "claude-opus-4-8";

function money(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1).replace(".", ",")} млрд`;
  if (v >= 1e6) return `$${Math.round(v / 1e6)} млн`;
  return `$${v}`;
}

// Контекст из БД: витрина + свежие новости + распорядок постинга
async function buildContext(prisma: PrismaClient): Promise<string> {
  const [projects, news] = await Promise.all([
    prisma.project.findMany({
      where: { isActive: true },
      select: { name: true, sector: true, dealStatus: true, valuation: true, expectedExit: true, expectedReturn: true, videoStatus: true },
      orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
    }),
    prisma.newsItem.findMany({
      where: { isActive: true },
      orderBy: [{ isHot: "desc" }, { publishedAt: "desc" }],
      take: 8,
      select: { title: true, category: true },
    }),
  ]);

  const showcase = projects
    .map((p) => `— ${p.name} (${p.sector || "—"}), ${p.dealStatus === "closed" ? "закрыт" : "открыт"}, оценка входа ${money(p.valuation)}, выход ${p.expectedExit || "—"}${p.videoStatus === "completed" ? ", есть видео" : ""}`)
    .join("\n");
  const newsList = news.map((n) => `— ${n.category ? `[${n.category}] ` : ""}${n.title}`).join("\n");

  return [
    "ВИТРИНА КОМПАНИЙ (для утренних постов 9:45, с видео):",
    showcase || "—",
    "",
    "СВЕЖИЕ НОВОСТИ (для обеденных постов 13:00):",
    newsList || "—",
    "",
    "РАСПОРЯДОК КАНАЛА @preipopro: 09:45 — компания из витрины (с видео), 13:00 — новость рынка. Каждый пост со ссылкой на Вестник (pre-ipo.pro/news).",
  ].join("\n");
}

const SYSTEM = `Ты — ассистент владельца Telegram-канала @preipopro (витрина pre-IPO компаний, pre-ipo.pro).
Помогаешь по ВОПРОСАМ КАНАЛА: план постов на день, идеи и рубрики контента, что сейчас в витрине и новостях, черновики анонсов и подписей, темы для постов, короткая аналитика по каналу.
Тон бренда: private banking, спокойно и экспертно, БЕЗ хайпа и обещаний «иксов»/гарантий доходности. Пиши по-русски, кратко и по делу, в telegram-формате (короткие абзацы, при нужде — списки).
Если просят сгенерировать пост — дай готовый текст, который можно сразу опубликовать.
Если вопрос про правку САЙТА или контента на сайте (не канал) — скажи, что это к боту правок @claudepreipobot.
Опирайся на данные ниже; если чего-то нет — честно скажи.`;

export async function answerChannelQuestion(prisma: PrismaClient, question: string): Promise<string> {
  const context = await buildContext(prisma);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Фолбэк без AI — хотя бы отдаём контекст
    return "AI-ответ недоступен (нет ANTHROPIC_API_KEY на сервере). Текущее состояние канала:\n\n" + context;
  }
  try {
    const anthropic = new Anthropic({ apiKey: key });
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM + "\n\nДАННЫЕ:\n" + context,
      messages: [{ role: "user", content: question }],
    });
    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
    return text || "Не удалось сформировать ответ. Переформулируй, пожалуйста.";
  } catch (e) {
    return "Ошибка AI: " + (e instanceof Error ? e.message : String(e));
  }
}
