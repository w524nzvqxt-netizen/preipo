// Telegram-бот канала @preipopro — AI-ассистент для владельца.
// На проде работает через webhook /api/tg/channel. Отвечает ТОЛЬКО владельцу
// (AUTHORIZED_CHAT_ID); остальным — вежливая заглушка.
//
// Важно про вебхук: ответ AI долгий (несколько секунд). Если держать вебхук
// открытым до конца ответа, Telegram считает доставку неуспешной и ШЛЁТ АПДЕЙТ
// ПОВТОРНО → бот отвечает много раз. Поэтому: (1) дедуп по update_id, (2) сам
// AI-ответ считаем в фоне и сразу отпускаем вебхук (хендлер завершается мгновенно).
import { Bot } from "grammy";
import type { PrismaClient } from "../generated/prisma/client";
import { answerChannelQuestion } from "./channel-assistant";

export function createChannelBot(prisma: PrismaClient, token: string): Bot {
  const bot = new Bot(token);
  const owner = () => process.env.AUTHORIZED_CHAT_ID;

  // Дедуп апдейтов: Telegram ретраит доставку одного и того же update_id.
  const seen = new Set<number>();
  bot.use(async (ctx, next) => {
    const uid = ctx.update.update_id;
    if (seen.has(uid)) return; // повтор ретрая — молча пропускаем
    seen.add(uid);
    if (seen.size > 2000) seen.delete(seen.values().next().value as number);
    await next();
  });

  bot.command("start", async (ctx) => {
    if (owner() && String(ctx.from!.id) === owner()) {
      return ctx.reply(
        "Привет! Я ассистент по каналу @preipopro.\n\n" +
        "Спрашивай: «план на сегодня», «идеи постов на неделю», «что в витрине», «напиши анонс про FinSight».\n\n" +
        "Правки сайта и контента — боту @claudepreipobot."
      );
    }
    return ctx.reply("Это служебный бот канала @preipopro.");
  });

  bot.on("message:text", async (ctx) => {
    if (!owner() || String(ctx.from!.id) !== owner()) {
      return ctx.reply("Это служебный бот канала @preipopro.");
    }
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;
    const chatId = ctx.chat.id;

    // Fire-and-forget: не держим вебхук открытым, пока думает AI (иначе ретраи-дубли).
    void (async () => {
      try {
        await ctx.api.sendChatAction(chatId, "typing").catch(() => {});
        const ans = await answerChannelQuestion(prisma, text);
        try {
          await ctx.api.sendMessage(chatId, ans, { parse_mode: "Markdown" });
        } catch {
          await ctx.api.sendMessage(chatId, ans).catch(() => {});
        }
      } catch (e) {
        console.error("channel reply error:", e);
      }
    })();
    // хендлер завершается сразу → вебхук отвечает Telegram 200 мгновенно
  });

  bot.catch((e) => console.error("channel bot error:", e));
  return bot;
}
