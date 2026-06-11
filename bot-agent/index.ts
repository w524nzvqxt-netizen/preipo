// Локальный запуск Telegram-бота кабинета партнёра (@preipoprobot) через long-polling.
// ⚠️ На проде бот работает webhook'ом внутри сайта (/api/tg/webhook) с прод-базой.
// Локальный запуск СНИМАЕТ вебхук — вход через TG на проде перестанет работать,
// пока не вернёшь его: npx tsx scripts/set-tg-webhook.ts
// Поэтому запуск требует явного флага: npx tsx bot-agent/index.ts --local
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createAgentBot } from "../src/lib/agent-bot";

// --- .env (standalone-скрипт сам не грузит) ---
function loadEnv() {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const token = process.env.AGENT_BOT_TOKEN;
if (!token) {
  console.error("Нет AGENT_BOT_TOKEN в .env");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }) });
const bot = createAgentBot(prisma, token);

async function main() {
  const info = await bot.api.getWebhookInfo();
  if (info.url && !process.argv.includes("--local")) {
    console.error(
      `Бот сейчас работает на проде через webhook: ${info.url}\n` +
        `Локальный long-polling снимет вебхук и сломает вход через TG на сайте.\n` +
        `Если точно нужно локально: npx tsx bot-agent/index.ts --local\n` +
        `Вернуть прод-вебхук потом: npx tsx scripts/set-tg-webhook.ts`
    );
    process.exit(1);
  }
  if (info.url) {
    await bot.api.deleteWebhook();
    console.log(`Вебхук ${info.url} снят — работаем локально (база dev.db).`);
  }
  bot.start({ onStart: (me) => console.log(`Бот @${me.username} запущен (long-polling)`) });
}

main();
