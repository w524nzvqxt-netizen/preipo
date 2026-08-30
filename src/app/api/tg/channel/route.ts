// Webhook бота КАНАЛА @preipoprobot (AI-ассистент по каналу для владельца).
// Партнёрский кабинет — на другом боте (@PIPatners_bot), см. /api/tg/webhook.
// Установка вебхука: npx tsx scripts/set-tg-webhook.ts (ставит оба).
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import type { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import { createChannelBot } from "@/lib/channel-bot";
import { webhookSecret } from "@/lib/agent-bot";

export const dynamic = "force-dynamic";

let bot: Bot | null = null;
let handle: ((req: Request) => Promise<Response>) | null = null;

function init() {
  const token = process.env.AGENT_BOT_TOKEN; // @preipoprobot — бот канала
  if (!token) return null;
  if (!handle) {
    bot = createChannelBot(prisma, token);
    handle = webhookCallback(bot, "std/http", { secretToken: webhookSecret(token) });
  }
  return handle;
}

export async function POST(req: NextRequest) {
  const h = init();
  if (!h || !bot) {
    return NextResponse.json({ error: "AGENT_BOT_TOKEN не настроен" }, { status: 503 });
  }
  if (!bot.isInited()) await bot.init();
  try {
    return await h(req);
  } catch (e) {
    console.error("tg channel webhook error:", e);
    return new NextResponse(null, { status: 401 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, tokenConfigured: Boolean(process.env.AGENT_BOT_TOKEN) });
}
