// Авто-постер в Telegram-канал pre-ipo.pro.
// 2 поста в день: `article` (обучающий пост из docs/tg-articles.md) и
// `news` (свежая новость из dev.db). Контент берётся локально — БЕЗ обращения к API.
//
// Запуск:
//   node bot/poster.mjs article      — следующий обучающий пост (ротация)
//   node bot/poster.mjs news         — свежая ещё не опубликованная новость
//   node bot/poster.mjs              — авто: чередует news / article
//   добавь --dry-run                 — показать текст, НЕ отправлять
//
// Требуется в .env: TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID (@username или -100…).
// Бот должен быть АДМИНОМ канала с правом публикации.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(DIR, "..");

// --- Самозагрузка .env ---
for (const p of [path.join(ROOT, ".env")]) {
  try {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

// @preipoprobot = AGENT_BOT_TOKEN (он админ канала). Можно переопределить POSTER_BOT_TOKEN.
const TOKEN = process.env.POSTER_BOT_TOKEN || process.env.AGENT_BOT_TOKEN;
const CHANNEL = process.env.TELEGRAM_CHANNEL_ID;
const DRY = process.argv.includes("--dry-run");
const MODE = (process.argv[2] && !process.argv[2].startsWith("--")) ? process.argv[2] : "auto";
const STATE_FILE = path.join(DIR, "poster-state.json");

const LOG_FILE = path.join(DIR, "poster.log");
function log(line) {
  const s = `${new Date().toISOString()}  ${line}`;
  console.log(s);
  try { fs.appendFileSync(LOG_FILE, s + "\n"); } catch {}
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}
function saveState(s) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch (e) { console.error("state save:", e.message); }
}

// --- md → Telegram HTML (жирный, курсив, экранирование) ---
function toTgHtml(md) {
  let s = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  s = s.replace(/(^|[\s(])_(.+?)_(?=[\s.,;:)!?]|$)/g, "$1<i>$2</i>");
  return s.trim();
}

// --- Источник 1: обучающие посты из docs/tg-articles.md ---
function loadArticles() {
  const file = path.join(ROOT, "docs", "tg-articles.md");
  const raw = fs.readFileSync(file, "utf8");
  const parts = raw.split(/\n## /).slice(1); // секции
  const posts = [];
  for (const p of parts) {
    const nl = p.indexOf("\n");
    const heading = p.slice(0, nl).trim();
    if (!/^Пост\s*\d+/i.test(heading)) continue; // только «Пост N …»
    let body = p.slice(nl + 1);
    body = body.split("\n---")[0].trim(); // до разделителя
    // заголовок: часть после «— »
    const title = heading.replace(/^Пост\s*\d+\s*[—-]\s*/i, "").trim();
    posts.push({ title, body });
  }
  return posts;
}

function buildArticleMessage(st) {
  const posts = loadArticles();
  if (!posts.length) throw new Error("Нет постов в docs/tg-articles.md");
  const idx = (st.articleIndex ?? -1) + 1;
  const post = posts[idx % posts.length];
  st.articleIndex = idx % posts.length;
  const text = `<b>${toTgHtml(post.title)}</b>\n\n${toTgHtml(post.body)}\n\n— Pre-IPO`;
  return text;
}

// --- Источник 2: свежая новость из dev.db ---
function buildNewsMessage(st) {
  const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
  const posted = new Set(st.postedNewsIds || []);
  const rows = db.prepare(
    "SELECT id,title,summary,category,sourceName,sourceUrl FROM NewsItem WHERE isActive=1 ORDER BY isHot DESC, publishedAt DESC LIMIT 40"
  ).all();
  db.close();
  const next = rows.find((r) => !posted.has(r.id));
  if (!next) return null; // новых нет — вернём null, вызывающий переключится на article
  st.postedNewsIds = [...(st.postedNewsIds || []), next.id].slice(-200);
  const cat = next.category ? `#${next.category.replace(/\s+/g, "_")}\n` : "";
  const src = next.sourceUrl ? `\n\n<a href="${next.sourceUrl}">${toTgHtml(next.sourceName || "Источник")}</a>` : "";
  return `${cat}<b>${toTgHtml(next.title)}</b>\n\n${toTgHtml(next.summary)}${src}\n\n— Pre-IPO`;
}

// --- Отправка ---
async function send(text) {
  if (!TOKEN) throw new Error("Токен постера не задан (AGENT_BOT_TOKEN / POSTER_BOT_TOKEN) в .env");
  if (!CHANNEL) throw new Error("TELEGRAM_CHANNEL_ID не задан в .env (@username или -100…)");
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL,
      text: text.slice(0, 4090),
      parse_mode: "HTML",
      disable_web_page_preview: false,
      link_preview_options: { is_disabled: false },
    }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error("Telegram: " + JSON.stringify(j));
  return j.result?.message_id;
}

(async () => {
  const st = loadState();
  // выбор режима
  let mode = MODE;
  if (mode === "auto") mode = (st.lastMode === "news") ? "article" : "news";

  let text = null;
  if (mode === "news") {
    text = buildNewsMessage(st);
    if (!text) { console.log("Новых новостей нет — беру обучающий пост."); mode = "article"; }
  }
  if (mode === "article") text = buildArticleMessage(st);

  if (!text) throw new Error("Не удалось собрать текст поста");

  if (DRY) {
    console.log(`── [${mode}] предпросмотр (${text.length} симв.) ──\n`);
    console.log(text.replace(/<\/?[^>]+>/g, "")); // без html-тегов для читаемости
    return;
  }

  const id = await send(text);
  st.lastMode = mode;
  st.lastPostedAt = new Date().toISOString();
  saveState(st);
  log(`✅ Опубликовано [${mode}] в ${CHANNEL}, message_id=${id}`);
})().catch((e) => { log("❌ " + e.message); process.exit(1); });
