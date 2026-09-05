// Авто-постер в Telegram-канал pre-ipo.pro.
// 2 поста в день: `article` (обучающий пост из docs/tg-articles.md) и
// `news` (свежая новость из dev.db). Контент берётся локально — БЕЗ обращения к API.
//
// Запуск:
//   node bot/poster.mjs article      — следующий обучающий пост (ротация)
//   node bot/poster.mjs news         — свежая ещё не опубликованная новость
//   node bot/poster.mjs digest       — дайджест: несколько свежих новостей одним постом
//   node bot/poster.mjs books        — презентация двух книг + файлы (PDF+EPUB)
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

// --- Дайджест: несколько свежих новостей одним постом ---
function firstSentence(s) {
  const t = (s || "").trim();
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
}
function buildDigestMessage() {
  const db = new Database(path.join(ROOT, "dev.db"), { readonly: true });
  const rows = db.prepare(
    "SELECT title,summary,category,sourceName,sourceUrl,publishedAt FROM NewsItem WHERE isActive=1 ORDER BY publishedAt DESC, isHot DESC LIMIT 40"
  ).all();
  db.close();
  if (!rows.length) return null;
  // берём свежее «окно»: последние 10 дней от самой свежей новости, но не больше 7 пунктов
  const ms = (v) => new Date(v).getTime();
  const newest = ms(rows[0].publishedAt);
  const WINDOW = 10 * 24 * 3600 * 1000;
  let items = rows.filter((r) => newest - ms(r.publishedAt) <= WINDOW).slice(0, 7);
  if (items.length < 3) items = rows.slice(0, 5); // если свежих мало — берём топ-5
  const dfmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const head = `📰 <b>Дайджест pre-IPO · ${dfmt.format(new Date(newest))}</b>\n\nГлавное на частных рынках за последние дни:`;
  const lines = items.map((r, i) => {
    const cat = r.category ? ` <i>#${r.category.replace(/\s+/g, "_")}</i>` : "";
    const gloss = firstSentence(r.summary);
    const src = r.sourceUrl ? ` <a href="${r.sourceUrl}">${toTgHtml(r.sourceName || "источник")} ↗</a>` : "";
    return `${i + 1}. <b>${toTgHtml(r.title)}</b>${cat}\n${toTgHtml(gloss)}${src}`;
  });
  return `${head}\n\n${lines.join("\n\n")}${FOOTER}`;
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
    "SELECT id,name,segment,valuationLabel,oneLiner,business,plans,nextRound,lastNews,analysis FROM KbCompany WHERE isActive=1 ORDER BY valuationUSD DESC"
  ).all();
  db.close();
  if (!rows.length) return null;
  const idx = ((st.kbIndex ?? -1) + 1) % rows.length;
  st.kbIndex = idx;
  const p = rows[idx];
  // Полноценный разбор: чем занимается + перспективы (+ взгляд), из полей базы.
  let caption = `🏛 <b>${toTgHtml(p.name)}</b>`;
  const head = [p.segment, p.valuationLabel].filter(Boolean).map(toTgHtml).join(" · ");
  if (head) caption += `\n${head}`;
  const business = p.business || p.oneLiner;
  if (business) caption += `\n\n<b>Чем занимается</b>\n${toTgHtml(business)}`;
  if (p.plans) caption += `\n\n<b>Перспективы</b>\n${toTgHtml(p.plans)}`;
  if (p.nextRound) caption += `\n↗ ${toTgHtml(p.nextRound)}`;
  if (p.analysis) caption += `\n\n<b>Взгляд</b>\n${toTgHtml(p.analysis)}`;
  caption += `\n\n<a href="${SITE}/base/${p.id}">Полный разбор и график оценки →</a>${FOOTER}`;
  return { caption };
}

// --- Источник 5: разбор публичной компании (docs/public-analyses.json) ---
function buildAnalysisMessage(st) {
  let store;
  try { store = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "public-analyses.json"), "utf8")); } catch { return null; }
  const keys = Object.keys(store);
  if (!keys.length) return null;
  const idx = ((st.analysisIndex ?? -1) + 1) % keys.length;
  st.analysisIndex = idx;
  const a = store[keys[idx]];
  if (!a) return null;
  // Компактный пост под лимит Telegram (полный разбор — в docs/public-analyses.json / на сайте)
  const risks = (a.risks || []).slice(0, 3).map((r) => `• ${toTgHtml(r)}`).join("\n");
  let t = `🏦 <b>${toTgHtml(a.name)}</b> (${toTgHtml(a.ticker)}) · ${toTgHtml(a.sector || "")}`;
  if (a.asOf) t += `\n<i>Данные: ${toTgHtml(a.asOf)}</i>`;
  if (a.snapshot) t += `\n\n${toTgHtml(a.snapshot)}`;
  if (a.financials) t += `\n\n<b>Финансы</b>\n${toTgHtml(a.financials)}`;
  if (a.valuation) t += `\n\n<b>Оценка</b>\n${toTgHtml(a.valuation)}`;
  if (risks) t += `\n\n<b>Ключевые риски</b>\n${risks}`;
  if (a.verdict) t += `\n\n<b>Вывод</b>\n${toTgHtml(a.verdict)}`;
  t += `\n\n<i>Не индивидуальная инвестиционная рекомендация.</i>${FOOTER}`;
  return t.length > 4050 ? t.slice(0, 4040).replace(/\s+\S*$/, "") + "…" + FOOTER : t;
}

// --- Презентация книг (текст) ---
const BOOKS = [
  {
    emoji: "📕", title: "До биржи",
    sub: "Практический учебник по инвестициям в частные компании. История и этапы частных рынков, методы оценки непубличных компаний, разбор громких провалов и взлётов — и, главное, как честно встроить pre-IPO в портфель: доля, риск, ликвидность.",
    facts: "6 частей · 25 глав · ~230 страниц",
    pdf: "preipo-book/Do-birzhi.pdf", epub: "preipo-book/Do-birzhi.epub",
    nicePdf: "До биржи.pdf", niceEpub: "До биржи.epub",
    cover: "public/uploads/cover-do-birzhi.png",
  },
  {
    emoji: "📘", title: "Разум машин",
    sub: "Иллюстрированный учебник по искусственному интеллекту — с нуля до уверенного понимания: что такое ИИ и что им не является, как он устроен внутри, кто и где его создаёт и куда всё движется. Без магии и без паники.",
    facts: "6 частей · 40 глав · десятки схем · ~350 страниц",
    pdf: "ai-textbook/Razum-mashin.pdf", epub: "ai-textbook/Razum-mashin.epub",
    nicePdf: "Разум машин.pdf", niceEpub: "Разум машин.epub",
    cover: "public/uploads/cover-razum-mashin.png",
  },
];
function buildBooksMessage() {
  const head = "📚 <b>Две книги проекта pre-IPO</b>\n\nДва иллюстрированных учебника — честно и без хайпа о силах, которые формируют рынки будущего. С чертежами, реальными фактами и живым языком.";
  const blocks = BOOKS.map((b) => `${b.emoji} <b>${b.title}</b>\n${toTgHtml(b.sub)}\n<i>${toTgHtml(b.facts)}</i>`);
  const tail = "Оба учебника — в PDF (готово к печати) и EPUB (для читалок и Kindle). Файлы — ниже 👇";
  return `${head}\n\n${blocks.join("\n\n")}\n\n${tail}\n\n🌐 <a href="${SITE}">pre-ipo.pro</a>`;
}

// --- Отправка группы документов (медиагруппа) ---
async function sendDocsGroup(files) {
  if (!TOKEN) throw new Error("Токен постера не задан");
  if (!CHANNEL) throw new Error("TELEGRAM_CHANNEL_ID не задан");
  const form = new FormData();
  form.append("chat_id", CHANNEL);
  const media = files.map((f, i) => ({
    type: "document",
    media: `attach://f${i}`,
    ...(f.caption ? { caption: f.caption.slice(0, 1024), parse_mode: "HTML" } : {}),
  }));
  form.append("media", JSON.stringify(media));
  for (let i = 0; i < files.length; i++) {
    const buf = fs.readFileSync(files[i].path);
    form.append(`f${i}`, new Blob([buf], { type: files[i].type || "application/octet-stream" }), files[i].filename);
  }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMediaGroup`, { method: "POST", body: form });
  const j = await res.json();
  if (!j.ok) throw new Error("Telegram sendMediaGroup: " + JSON.stringify(j));
  return (j.result || []).map((m) => m.message_id);
}

// --- Отправка группы фото (обложки книг) ---
async function sendPhotosGroup(files, caption) {
  if (!TOKEN) throw new Error("Токен постера не задан");
  if (!CHANNEL) throw new Error("TELEGRAM_CHANNEL_ID не задан");
  const form = new FormData();
  form.append("chat_id", CHANNEL);
  const media = files.map((f, i) => ({
    type: "photo",
    media: `attach://p${i}`,
    ...(i === 0 && caption ? { caption: caption.slice(0, 1024), parse_mode: "HTML" } : {}),
  }));
  form.append("media", JSON.stringify(media));
  for (let i = 0; i < files.length; i++) {
    const buf = fs.readFileSync(files[i].path);
    form.append(`p${i}`, new Blob([buf], { type: files[i].type || "image/png" }), files[i].filename);
  }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMediaGroup`, { method: "POST", body: form });
  const j = await res.json();
  if (!j.ok) throw new Error("Telegram sendMediaGroup(photo): " + JSON.stringify(j));
  return (j.result || []).map((m) => m.message_id);
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

  // Режим books — презентация книг: текстовый пост + файлы (PDF+EPUB) по каждой книге
  if (mode === "books") {
    const text = buildBooksMessage();
    if (DRY) {
      console.log(`── [books] предпросмотр (${text.length} симв.) ──\n`);
      console.log(text.replace(/<\/?[^>]+>/g, ""));
      for (const b of BOOKS) {
        const c = b.cover ? path.join(ROOT, b.cover) : null;
        console.log(`  ${c && fs.existsSync(c) ? "✔" : "✗ НЕТ"} ОБЛОЖКА: ${b.title}  (${b.cover || "—"})`);
        for (const [k, disk, nice] of [["PDF", b.pdf, b.nicePdf], ["EPUB", b.epub, b.niceEpub]]) {
          const p = path.join(ROOT, disk);
          console.log(`  ${fs.existsSync(p) ? "✔" : "✗ НЕТ"} ${k}: ${nice}  (${disk})`);
        }
      }
      return;
    }
    // Обложки — фото-альбомом (визуальный хук перед текстом)
    const covers = BOOKS
      .map((b) => (b.cover ? { path: path.join(ROOT, b.cover), filename: path.basename(b.cover) } : null))
      .filter((c) => c && fs.existsSync(c.path));
    if (covers.length) {
      try {
        const capt = `📚 <b>Книги проекта pre-IPO</b> — обложки\nАвтор: <b>Канал pre-ipo.pro</b>`;
        const cids = await sendPhotosGroup(covers.map((c) => ({ path: c.path, filename: c.filename, type: "image/png" })), capt);
        log(`✅ Обложки отправлены: ${cids.join(", ")}`);
      } catch (e) { log("⚠ обложки не отправлены: " + (e instanceof Error ? e.message : e)); }
    }
    const tid = await send(text);
    log(`✅ Презентация книг (текст) опубликована, message_id=${tid}`);
    for (const b of BOOKS) {
      const files = [];
      const pdf = path.join(ROOT, b.pdf), epub = path.join(ROOT, b.epub);
      if (fs.existsSync(pdf)) files.push({ path: pdf, filename: b.nicePdf, type: "application/pdf", caption: `${b.emoji} <b>${toTgHtml(b.title)}</b> · ${toTgHtml(b.facts)}\nPDF (для печати) и EPUB (для читалок)` });
      if (fs.existsSync(epub)) files.push({ path: epub, filename: b.niceEpub, type: "application/epub+zip" });
      if (!files.length) { log(`⚠ нет файлов для «${b.title}» — пропуск`); continue; }
      const ids = await sendDocsGroup(files);
      log(`✅ Файлы «${b.title}» отправлены: ${ids.join(", ")}`);
    }
    return;
  }

  // Собираем пост: { text, videoPath? }
  let post = null;
  if (mode === "news") {
    const t = buildNewsMessage(st);
    if (!t) { log("Новых новостей нет — беру обучающий пост."); mode = "article"; }
    else post = { text: t };
  }
  if (mode === "digest") {
    const t = buildDigestMessage();
    if (!t) { log("Нет новостей для дайджеста — беру обучающий пост."); mode = "article"; }
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
  if (mode === "analysis") {
    const t = buildAnalysisMessage(st);
    if (!t) { log("Нет разборов публичных компаний — беру обучающий пост."); mode = "article"; }
    else post = { text: t };
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
