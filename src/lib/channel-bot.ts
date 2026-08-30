// Telegram-бот канала @preipopro — AI-ассистент для владельца.
// На проде работает через webhook /api/tg/channel. Отвечает ТОЛЬКО владельцу
// (AUTHORIZED_CHAT_ID); остальным — вежливая заглушка.
import { Bot } from "grammy";
import type { PrismaClient } from "../generated/prisma/client";
import { answerChannelQuestion } from "./channel-assistant";

export function createChannelBot(prisma: PrismaClient, token: string): Bot {
  const bot = new Bot(token);
  const owner = () => process.env.AUTHORIZED_CHAT_ID;

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
    await ctx.replyWithChatAction("typing").catch(() => {});
    const ans = await answerChannelQuestion(prisma, text);
    try { return await ctx.reply(ans, { parse_mode: "Markdown" }); }
    catch { return ctx.reply(ans); }
  });

  bot.catch((e) => console.error("channel bot error:", e));
  return bot;
}
