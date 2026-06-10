// Telegram-бот для правок сайта pre-ipo.pro.
// Пишешь боту правку → запускается Claude-агент в репозитории → правит,
// собирает (npm run build), коммитит и пушит → Railway пересобирает прод.
// Доступ только для AUTHORIZED_CHAT_ID.
import { Bot } from "grammy";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Самозагрузка .env (чтобы работало и при запуске `node bot/index.mjs` без --env-file)
{
  const dir = path.dirname(fileURLToPath(import.meta.url));
  for (const p of [path.join(dir, "..", ".env"), path.resolve(".env")]) {
    try {
      for (const line of fs.readFileSync(p, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
      }
    } catch {}
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER = String(process.env.AUTHORIZED_CHAT_ID || "");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "w524nzvqxt-netizen/preipo";
const REPO_DIR = process.env.REPO_DIR || path.resolve(process.cwd(), "repo");
const MODEL = process.env.BOT_MODEL || "claude-sonnet-4-6";

if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY не задан");

// Подготовка репозитория (клон при первом запуске)
function ensureRepo() {
  if (!fs.existsSync(path.join(REPO_DIR, ".git"))) {
    const url = GITHUB_TOKEN
      ? `https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`
      : `https://github.com/${GITHUB_REPO}.git`;
    console.log("Клонирую репозиторий…");
    execSync(`git clone ${url} "${REPO_DIR}"`, { stdio: "inherit" });
    execSync(`git -C "${REPO_DIR}" config user.email "bot@pre-ipo.pro"`);
    execSync(`git -C "${REPO_DIR}" config user.name "preipo-bot"`);
  } else {
    try { execSync(`git -C "${REPO_DIR}" pull --ff-only`, { stdio: "ignore" }); } catch {}
  }
  if (!fs.existsSync(path.join(REPO_DIR, "node_modules"))) {
    console.log("npm install (один раз, может занять время)…");
    execSync(`npm install`, { cwd: REPO_DIR, stdio: "inherit" });
  }
}

const SYSTEM = `Ты — инженер сайта pre-ipo.pro (Next.js 16, Tailwind v4 «Obsidian Capital», Prisma/SQLite, контент в dev.db). Репозиторий — текущая папка, подключён к GitHub→Railway (auto-deploy).
Алгоритм на каждую правку от пользователя:
1. Перед началом: git pull --ff-only (чтобы не разойтись с прод).
2. Внеси изменения в код/контент. Контент сделок — через скрипты в prisma/ (add-deal.cjs и т.п.), они пишут в dev.db.
3. Проверь сборку: npm run build — должно быть без ошибок TypeScript. Если падает — почини.
4. Закоммить по-русски и запушь: git add -A (без .env), git commit, git push origin main.
5. Кратко отчитайся 1-3 предложениями: что сделал. Если не уверен в правке — уточни, не ломая прод.
6. После пуша допиши ОДНУ строку в файл bot/activity.log: дата в ISO, кратко что сделал, и хэш коммита (git rev-parse --short HEAD). Файл bot/activity.log — в .gitignore, его НЕ коммить.

Совместная работа: над этим же репозиторием параллельно работает Claude Code-сессия разработчика (другой Клод). Поэтому ВСЕГДА делай git pull --ff-only перед правкой — чтобы видеть его изменения и не разойтись. Загляни в bot/activity.log и git log, чтобы понять недавний контекст. Если правки могут пересечься — действуй аккуратно, маленькими коммитами.
Никогда не коммить .env/секреты. Не пушить при падающем билде. Все суммы/цифры — только проверенные.`;

console.log(`Конфиг: токен ${TOKEN ? "есть" : "НЕТ"}, владелец ${OWNER || "(не задан)"}, repo ${REPO_DIR}, модель ${MODEL}`);
console.log("Подготовка репозитория…");
try {
  ensureRepo();
} catch (e) {
  console.error("ensureRepo (не критично):", e.message);
}

const bot = new Bot(TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `Привет! Пиши правку по сайту pre-ipo.pro — я сделаю и задеплою.\nТвой chat id: ${ctx.chat.id}\nДоступ только для владельца.`
  )
);

bot.on("message:text", async (ctx) => {
  // fail-closed: без заданного владельца команды не выполняются (только выдаём chat id)
  if (!OWNER || String(ctx.chat.id) !== OWNER) {
    return ctx.reply(`Доступ ещё не настроен или запрещён.\nТвой chat id: ${ctx.chat.id}\nВпиши его в AUTHORIZED_CHAT_ID и перезапусти бота.`);
  }
  const task = ctx.message.text;
  if (task.startsWith("/")) return;

  const status = await ctx.reply("🛠 Принято, делаю…");
  let last = 0;
  const buf = [];
  const edit = async (text) => {
    try {
      await ctx.api.editMessageText(ctx.chat.id, status.message_id, text.slice(0, 3900));
    } catch {}
  };

  try {
    let final = "";
    for await (const m of query({
      prompt: task,
      options: {
        cwd: REPO_DIR,
        model: MODEL,
        permissionMode: "bypassPermissions",
        allowedTools: ["Read", "Edit", "Write", "Bash", "Grep", "Glob"],
        systemPrompt: { type: "preset", preset: "claude_code", append: SYSTEM },
      },
    })) {
      if (m.type === "assistant") {
        const t = (m.message?.content || [])
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join(" ");
        if (t) {
          buf.push(t);
          if (Date.now() - last > 2500) {
            last = Date.now();
            await edit("🛠 " + buf.join("\n").slice(-3700));
          }
        }
      } else if (m.type === "result") {
        final = m.result || "Готово.";
      }
    }
    await edit("✅ " + (final || "Готово.").slice(0, 3900));
  } catch (e) {
    await edit("❌ Ошибка: " + String(e?.message || e).slice(0, 600));
  }
});

bot.catch((err) => console.error("bot error", err));
bot.start();
console.log("Бот запущен. Жду сообщения.");
