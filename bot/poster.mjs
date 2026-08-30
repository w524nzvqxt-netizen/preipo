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
const SITE = process.env.SITE_URL || "https://pre-ipo.pro";
const FOOTER = `\n\n📰 <a href="${SITE}/news">Вестник pre-IPO</a> · <a href="${SITE}">pre-ipo.pro</a>`;
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
  const text = `<b>${toTgHtml(post.title)}</b>\n\n${toTgHtml(post.body)}${FOOTER}`;
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
  return `${cat}<b>${toTgHtml(next.title)}</b>\n\n${toTgHtml(next.summary)}${src}${FOOTER}`;
}

// --- Источник 3: компания из витрины (с видео, если есть) ---
function money(v) {
  if (v == null) return null;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1).replace(".", ",")} млрд`;
  if (v >= 1e6) return `$${Math.round(v / 1e6)} млн`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)} тыс`;
  return `$${v}`;
}
function buildDealMessage(st) {
  const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
  const rows = db.prepare(
    "SELECT id,name,sector,description,valuation,expectedExit,expectedReturn,videoUrl,videoStatus,dealStatus FROM Project WHERE isActive=1 ORDER BY isHot DESC, createdAt DESC"
  ).all();
  db.close();
  if (!rows.length) return null;
  const idx = ((st.dealIndex ?? -1) + 1) % rows.length;
  st.dealIndex = idx;
  const p = rows[idx];

  const facts = [];
  if (p.valuation) facts.push(`Оценка входа: ${money(p.valuation)}`);
  if (p.expectedExit) facts.push(`Прогноз выхода: ${p.expectedExit}`);
  if (p.expectedReturn) facts.push(`Доходность: ~${p.expectedReturn}%/год`);
  const desc = p.description ? p.description.split("\n")[0] : "";
  let caption = `🏛 <b>${toTgHtml(p.name)}</b>`;
  if (p.sector) caption += `\n${toTgHtml(p.sector)}`;
  if (desc) caption += `\n\n${toTgHtml(desc)}`;
  if (facts.length) caption += `\n\n${facts.map(toTgHtml).join("\n")}`;
  caption += `\n\n<a href="${SITE}/project/${p.id}">Открыть карточку →</a>${FOOTER}`;

  // видео карточки — прикрепляем, если завершено и в пределах лимита бота (50 МБ)
  let videoPath = null;
  if (p.videoStatus === "completed" && p.videoUrl && p.videoUrl.startsWith("/uploads/")) {
    const vp = path.join(ROOT, "public", p.videoUrl.replace(/^\//, ""));
    try { const sz = fs.statSync(vp).size; if (sz > 0 && sz < 49 * 1024 * 1024) videoPath = vp; } catch {}
  }
  return { caption, videoPath, name: p.name };
}

// --- Источник 4: компания из БАЗЫ pre-IPO (/base, все сектора) ---
function buildKbMessage(st) {
  const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
  const rows = db.prepare(
    "SELECT id,name,segment,valuationLabel,oneLiner,business,nextRound,lastNews FROM KbCompany WHERE isActive=1 ORDER BY valuationUSD DESC"
  ).all();
  db.close();
  if (!rows.length) return null;
  const idx = ((st.kbIndex ?? -1) + 1) % rows.length;
  st.kbIndex = idx;
  const p = rows[idx];
  let caption = `🏛 <b>${toTgHtml(p.name)}</b>`;
  const head = [p.segment, p.valuationLabel].filter(Boolean).map(toTgHtml).join(" · ");
  if (head) caption += `\n${head}`;
  const desc = p.oneLiner || (p.business ? p.business.split("\n")[0] : "");
  if (desc) caption += `\n\n${toTgHtml(desc)}`;
  if (p.nextRound) caption += `\n\n↗ ${toTgHtml(p.nextRound)}`;
  if (p.lastNews) caption += `\n📰 ${toTgHtml(p.lastNews)}`;
  caption += `\n\n<a href="${SITE}/base/${p.id}">Разбор и график оценки →</a>${FOOTER}`;
  return { caption };
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

// Отправка видео с подписью (multipart)
async function sendVideo(videoPath, caption) {
  if (!TOKEN) throw new Error("Токен постера не задан");
  if (!CHANNEL) throw new Error("TELEGRAM_CHANNEL_ID не задан");
  const buf = fs.readFileSync(videoPath);
  const form = new FormData();
  form.append("chat_id", CHANNEL);
  form.append("caption", caption.slice(0, 1024));
  form.append("parse_mode", "HTML");
  form.append("supports_streaming", "true");
  form.append("video", new Blob([buf], { type: "video/mp4" }), path.basename(videoPath));
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { method: "POST", body: form });
  const j = await res.json();
  if (!j.ok) throw new Error("Telegram sendVideo: " + JSON.stringify(j));
  return j.result?.message_id;
}

(async () => {
  const st = loadState();
  let mode = MODE;
  if (mode === "auto") mode = (st.lastMode === "news") ? "deal" : "news";

  // Режим plan — ЛС владельцу с планом постов на день (состояние не меняем)
  if (mode === "plan") {
    const owner = process.env.AUTHORIZED_CHAT_ID;
    if (!owner) throw new Error("AUTHORIZED_CHAT_ID не задан — некому слать план");
    const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
    const deals = db.prepare("SELECT name,videoUrl,videoStatus FROM Project WHERE isActive=1 ORDER BY isHot DESC, createdAt DESC").all();
    const news = db.prepare("SELECT id,title FROM NewsItem WHERE isActive=1 ORDER BY isHot DESC, publishedAt DESC LIMIT 60").all();
    db.close();
    const nextDeal = deals.length ? deals[((st.dealIndex ?? -1) + 1) % deals.length] : null;
    const posted = new Set(st.postedNewsIds || []);
    const nextNews = news.find((n) => !posted.has(n.id));
    const hasVid = nextDeal && nextDeal.videoStatus === "completed" && !!nextDeal.videoUrl;
    const txt = [
      "🗓 <b>План постов на сегодня — @preipopro</b>",
      "",
      `🏛 <b>09:45 · компания</b> — ${nextDeal ? toTgHtml(nextDeal.name) : "—"}${hasVid ? " 🎬 с видео" : ""}`,
      `📰 <b>13:00 · новость</b> — ${nextNews ? toTgHtml(nextNews.title) : "нет новых — выйдет обучающий пост"}`,
      "",
      "Изменить план — боту правок @claudepreipobot.",
    ].join("\n");
    if (DRY) { console.log(txt.replace(/<\/?[^>]+>/g, "")); return; }
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: owner, text: txt, parse_mode: "HTML" }),
    });
    const j = await res.json();
    if (!j.ok) throw new Error("DM плана: " + JSON.stringify(j));
    log(`✅ План отправлен владельцу (${owner})`);
    return;
  }

  // Собираем пост: { text, videoPath? }
  let post = null;
  if (mode === "news") {
    const t = buildNewsMessage(st);
    if (!t) { log("Новых новостей нет — беру обучающий пост."); mode = "article"; }
    else post = { text: t };
  }
  if (mode === "deal") {
    const d = buildDealMessage(st);
    if (!d) { log("Нет компаний в витрине — беру обучающий пост."); mode = "article"; }
    else post = { text: d.caption, videoPath: d.videoPath };
  }
  if (mode === "kb") {
    const d = buildKbMessage(st);
    if (!d) { log("База пуста — беру обучающий пост."); mode = "article"; }
    else post = { text: d.caption };
  }
  if (mode === "article") post = { text: buildArticleMessage(st) };

  if (!post) throw new Error("Не удалось собрать пост");

  if (DRY) {
    console.log(`── [${mode}]${post.videoPath ? " +ВИДЕО: " + path.basename(post.videoPath) : ""} предпросмотр (${post.text.length} симв.) ──\n`);
    console.log(post.text.replace(/<\/?[^>]+>/g, ""));
    return;
  }

  const id = post.videoPath ? await sendVideo(post.videoPath, post.text) : await send(post.text);
  st.lastMode = mode;
  st.lastPostedAt = new Date().toISOString();
  saveState(st);
  log(`✅ Опубликовано [${mode}]${post.videoPath ? " +видео" : ""} в ${CHANNEL}, message_id=${id}`);
})().catch((e) => { log("❌ " + e.message); process.exit(1); });
