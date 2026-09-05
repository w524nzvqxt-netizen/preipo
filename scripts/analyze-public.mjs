// ИИ-агент «Аналитик публичных AI-компаний».
// Через веб-поиск Claude собирает свежие данные и делает СУПЕР-ГЛУБОКИЙ
// оригинальный разбор публичных AI/compute-компаний (Nebius, IREN и т.п.).
// Результаты — в docs/public-analyses.json (для канала и сайта).
//
// Запуск:
//   node scripts/analyze-public.mjs            — следующая по ротации компания
//   node scripts/analyze-public.mjs Nebius     — конкретная компания
//   node scripts/analyze-public.mjs all         — все по очереди (дорого)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(DIR, "..");

// .env (standalone-скрипт сам не грузит)
for (const p of [path.join(ROOT, ".env")]) {
  try {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error("Нет ANTHROPIC_API_KEY в .env"); process.exit(1); }
const anthropic = new Anthropic({ apiKey: key });

// Публичные AI/compute-компании для мониторинга
const COMPANIES = [
  { name: "Nebius Group", ticker: "NBIS", sector: "AI-облако / GPU-инфраструктура" },
  { name: "IREN", ticker: "IREN", sector: "AI/HPC дата-центры (ex-Iris Energy)" },
  { name: "CoreWeave", ticker: "CRWV", sector: "AI-облако / GPU-инфраструктура" },
  { name: "Astera Labs", ticker: "ALAB", sector: "AI-полупроводники / connectivity" },
  { name: "Arm Holdings", ticker: "ARM", sector: "Полупроводники / IP" },
  { name: "Vertiv", ticker: "VRT", sector: "Питание и охлаждение ЦОД" },
  { name: "Rubrik", ticker: "RBRK", sector: "Кибербезопасность / данные" },
  { name: "Circle", ticker: "CRCL", sector: "Финтех / стейблкоины" },
];

const STORE = path.join(ROOT, "docs", "public-analyses.json");
function loadStore() { try { return JSON.parse(fs.readFileSync(STORE, "utf8")); } catch { return {}; } }
function saveStore(s) { fs.mkdirSync(path.dirname(STORE), { recursive: true }); fs.writeFileSync(STORE, JSON.stringify(s, null, 2)); }

const PROMPT = (c) => `Ты — старший инвестиционный аналитик по публичным AI- и compute-компаниям (облачный GPU-compute, дата-центры под ИИ, полупроводники, инфраструктура ЦОД). Проведи СУПЕР-ГЛУБОКИЙ разбор компании «${c.name}» (тикер ${c.ticker}, сектор: ${c.sector}).

Через веб-поиск найди САМЫЕ СВЕЖИЕ данные: последний квартальный отчёт (выручка, рост г/г, маржа, backlog/контракты, capex, денежный поток), гайденс, крупные сделки/контракты, оценка (капитализация, мультипликаторы EV/Sales, P/E где применимо), консенсус аналитиков.

Требования:
- Пиши ОРИГИНАЛЬНО, своими словами. НЕ копируй и не цитируй статьи дословно.
- Только реальные цифры из результатов поиска; если данных нет — так и скажи, не выдумывай.
- На русском, плотно и по делу, для образованного инвестора.
- Каждый факт-цифру подкрепляй источником (в массиве sources).

Верни СТРОГО JSON без markdown в формате:
{
 "name": "${c.name}",
 "ticker": "${c.ticker}",
 "sector": "${c.sector}",
 "asOf": "месяц и год данных, напр. Q2 2026",
 "snapshot": "1–2 предложения: чем компания зарабатывает",
 "business": "2–4 предложения: модель, сегменты, клиенты",
 "financials": "3–5 предложений с реальными цифрами: выручка, рост, маржа, capex, кэш",
 "moat": "2–3 предложения: конкурентное преимущество и позиция",
 "valuation": "2–3 предложения: капитализация и мультипликаторы, дорого/дёшево vs сектор",
 "risks": ["риск 1", "риск 2", "риск 3", "риск 4"],
 "catalysts": ["катализатор 1", "катализатор 2", "катализатор 3"],
 "bull": "бычий сценарий, 1–2 предложения",
 "bear": "медвежий сценарий, 1–2 предложения",
 "verdict": "взвешенный вывод, 2–3 предложения, без прямых торговых рекомендаций",
 "sources": [{"name":"...","url":"https://..."}]
}`;

// Убираем теги веб-поиска (<cite …>) и лишние пробелы из строк
function strip(s) {
  return typeof s === "string"
    ? s.replace(/<\/?cite[^>]*>/gi, "").replace(/[ \t]{2,}/g, " ").trim()
    : s;
}
function sanitize(o) {
  if (Array.isArray(o)) return o.map(sanitize);
  if (o && typeof o === "object") { for (const k in o) o[k] = sanitize(o[k]); return o; }
  return strip(o);
}

async function analyze(c) {
  const resp = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4500,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
    messages: [{ role: "user", content: PROMPT(c) }],
  });
  const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Не удалось извлечь JSON из ответа:\n" + text.slice(0, 400));
  return sanitize(JSON.parse(match[0]));
}

(async () => {
  const arg = process.argv[2];
  const store = loadStore();

  let targets;
  if (arg && arg.toLowerCase() === "all") {
    targets = COMPANIES;
  } else if (arg) {
    const c = COMPANIES.find((x) => x.name.toLowerCase().includes(arg.toLowerCase()) || x.ticker.toLowerCase() === arg.toLowerCase());
    if (!c) { console.error(`Компания «${arg}» не в списке. Доступны: ${COMPANIES.map((x) => x.ticker).join(", ")}`); process.exit(1); }
    targets = [c];
  } else {
    // ротация: самая давно не обновлявшаяся
    targets = [[...COMPANIES].sort((a, b) => (store[a.ticker]?.updatedAt || "") < (store[b.ticker]?.updatedAt || "") ? -1 : 1)[0]];
  }

  for (const c of targets) {
    process.stdout.write(`🔎 Анализирую ${c.name} (${c.ticker})… `);
    try {
      const a = await analyze(c);
      a.updatedAt = new Date().toISOString();
      store[c.ticker] = a;
      saveStore(store);
      console.log("готово.");
      console.log(`   ${a.snapshot || ""}`);
      console.log(`   Оценка: ${a.valuation || "—"}`);
      console.log(`   Вердикт: ${a.verdict || "—"}`);
    } catch (e) {
      console.log("ОШИБКА:", e instanceof Error ? e.message : e);
    }
  }
  console.log(`\nСохранено в ${path.relative(ROOT, STORE)} (${Object.keys(store).length} компаний).`);
  process.exit(0);
})();
