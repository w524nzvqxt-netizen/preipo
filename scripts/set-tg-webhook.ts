// Ставит вебхук @preipoprobot на прод-сайт (бот живёт в /api/tg/webhook).
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

const token = process.env.AGENT_BOT_TOKEN;
if (!token) {
  console.error("Нет AGENT_BOT_TOKEN в .env");
  process.exit(1);
}

const base = (process.argv[2] || "https://pre-ipo.pro").replace(/\/+$/, "");
const url = `${base}/api/tg/webhook`;
const secret = createHash("sha256").update(token).digest("hex"); // = webhookSecret() в src/lib/agent-bot.ts

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, secret_token: secret, drop_pending_updates: true }),
  });
  console.log(await res.json());
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  console.log(info);
}

main();
