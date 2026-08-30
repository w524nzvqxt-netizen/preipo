// Ставит вебхуки обоих ботов на прод-сайт:
//   @PIPatners_bot (PARTNER_BOT_TOKEN) → /api/tg/webhook   — кабинет партнёра
//   @preipoprobot  (AGENT_BOT_TOKEN)   → /api/tg/channel   — ассистент по каналу
// Запуск: npx tsx scripts/set-tg-webhook.ts [https://домен]
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

function loadEnv() {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const base = (process.argv[2] || "https://pre-ipo.pro").replace(/\/+$/, "");

async function setHook(token: string | undefined, path: string, label: string) {
  if (!token) {
    console.log(`${label}: нет токена в .env — пропуск`);
    return;
  }
  const url = `${base}${path}`;
  const secret = createHash("sha256").update(token).digest("hex"); // = webhookSecret()
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, secret_token: secret, drop_pending_updates: true }),
  });
  console.log(`${label} → ${url}:`, await res.json());
}

async function main() {
  await setHook(process.env.PARTNER_BOT_TOKEN, "/api/tg/webhook", "Кабинет партнёра (@PIPatners_bot)");
  await setHook(process.env.AGENT_BOT_TOKEN, "/api/tg/channel", "Канал/ассистент (@preipoprobot)");
}

main();
