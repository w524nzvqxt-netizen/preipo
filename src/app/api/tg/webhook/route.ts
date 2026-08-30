// Webhook Telegram-бота кабинета партнёра (@preipoprobot).
// Бот работает прямо в приложении сайта — с той же БД, поэтому подтверждение
// входа через TG видно сайту и на проде (раньше бот жил только локально).
// Установка вебхука: npx tsx scripts/set-tg-webhook.ts [https://домен]
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import type { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import { createAgentBot, webhookSecret } from "@/lib/agent-bot";

export const dynamic = "force-dynamic";

let bot: Bot | null = null;
let handle: ((req: Request) => Promise<Response>) | null = null;

function init() {
  const token = process.env.PARTNER_BOT_TOKEN;
  if (!token) return null;
  if (!handle) {
    bot = createAgentBot(prisma, token);
    handle = webhookCallback(bot, "std/http", { secretToken: webhookSecret(token) });
  }
  return handle;
}

export async function POST(req: NextRequest) {
  const h = init();
  if (!h || !bot) {
    return NextResponse.json({ error: "PARTNER_BOT_TOKEN не настроен" }, { status: 503 });
  }
  if (!bot.isInited()) await bot.init();
  try {
    return await h(req);
  } catch (e) {
    // Неверный секрет или битый апдейт — не роняем процесс
    console.error("tg webhook error:", e);
    return new NextResponse(null, { status: 401 });
  }
}

// Диагностика: настроен ли токен на этом окружении (без утечки значений)
export async function GET() {
  return NextResponse.json({ ok: true, tokenConfigured: Boolean(process.env.PARTNER_BOT_TOKEN) });
}
