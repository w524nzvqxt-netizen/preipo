// Авто-обновление базы pre-IPO AI-компаний.
// Раз в 12 часов: через Claude + веб-поиск ищет МАТЕРИАЛЬНЫЕ свежие новости по каждой
// компании (новый раунд, оценка, IPO, поглощение, крупный запуск), обновляет KbCompany
// и пушит dev.db на прод — только если есть реальные изменения.
// Запуск: node scripts/kb-refresh.mjs   (по расписанию — Task Scheduler, каждые 12ч)
import { readFileSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG = path.join(ROOT, "backups", "kb-refresh.log");
function log(s) { const line = `${new Date().toISOString()}  ${s}`; console.log(line); try { appendFileSync(LOG, line + "\n"); } catch {} }

// .env
try { for (const l of readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); } } catch {}

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { log("Нет ANTHROPIC_API_KEY — выход"); process.exit(1); }
const anthropic = new Anthropic({ apiKey: key });
const db = new Database(path.join(ROOT, "dev.db"));

// Надёжное извлечение первого сбалансированного JSON-массива из ответа модели
function extractArray(text) {
  const t = text.replace(/```json/gi, "").replace(/```/g, "");
  const start = t.indexOf("[");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) { try { return JSON.parse(t.slice(start, i + 1)); } catch { return null; } } }
  }
  return null;
}

const companies = db.prepare("SELECT name, valuationLabel FROM KbCompany WHERE isActive=1 ORDER BY valuationUSD DESC").all();
const BATCH = 12;
const batches = [];
for (let i = 0; i < companies.length; i += BATCH) batches.push(companies.slice(i, i + BATCH));

const SYS = `Ты — аналитик рынка pre-IPO. Найди через веб-поиск МАТЕРИАЛЬНЫЕ свежие новости за последние ~1-2 дня по перечисленным частным AI-компаниям: новый раунд финансирования, изменение оценки, конфиденциальная/публичная заявка на IPO или дата, поглощение/сделка, крупный запуск продукта.
Верни СТРОГО JSON-массив без markdown, ТОЛЬКО по компаниям, где есть реальная свежая новость (если ни у кого — []):
[{"name":"<точно как в списке>","valuationLabel":"<если оценка изменилась, напр. \\"$965 млрд\\">","valuationUSD":<число, если изменилась>,"nextRound":"<обновлённые намерения о раунде/IPO, если есть>","lastNews":"<последняя новость одной фразой по-русски + месяц>","lastNewsUrl":"<ссылка на источник>","newRound":{"round":"<название>","date":"YYYY-MM","valuationUSD":<число>}}]
newRound добавляй ТОЛЬКО если реально закрылся НОВЫЙ раунд с новой оценкой. Тон nextRound/lastNews — спокойный, без хайпа. Только проверенные факты, не выдумывай. Не включай компании без свежих новостей.`;

const updates = [];
for (let b = 0; b < batches.length; b++) {
  const list = batches[b].map((c) => `- ${c.name} (текущая оценка: ${c.valuationLabel || "?"})`).join("\n");
  try {
    const resp = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
      messages: [{ role: "user", content: SYS + "\n\nКОМПАНИИ:\n" + list }],
    });
    const text = resp.content.map((x) => (x.type === "text" ? x.text : "")).join("\n");
    const arr = extractArray(text);
    if (Array.isArray(arr)) updates.push(...arr);
    else log(`батч ${b + 1}: JSON не распознан`);
    log(`батч ${b + 1}/${batches.length}: проверено ${batches[b].length}`);
  } catch (e) { log(`батч ${b + 1}: ${e instanceof Error ? e.message : e}`); }
}

const now = new Date().toISOString().replace("Z", "+00:00");
let changed = 0;
for (const u of updates) {
  if (!u || !u.name) continue;
  const row = db.prepare("SELECT id, rounds FROM KbCompany WHERE name=?").get(u.name);
  if (!row) continue;
  let rounds = row.rounds;
  if (u.newRound && u.newRound.valuationUSD && u.newRound.date) {
    try { const arr = JSON.parse(row.rounds || "[]"); if (!arr.some((r) => r.date === u.newRound.date)) { arr.push(u.newRound); arr.sort((a, b) => String(a.date).localeCompare(String(b.date))); rounds = JSON.stringify(arr); } } catch {}
  }
  const r = db.prepare(`UPDATE KbCompany SET valuationLabel=COALESCE(?,valuationLabel), valuationUSD=COALESCE(?,valuationUSD), nextRound=COALESCE(?,nextRound), lastNews=COALESCE(?,lastNews), lastNewsUrl=COALESCE(?,lastNewsUrl), rounds=?, updatedAt=? WHERE id=?`)
    .run(u.valuationLabel ?? null, u.valuationUSD ?? null, u.nextRound ?? null, u.lastNews ?? null, u.lastNewsUrl ?? null, rounds, now, row.id);
  if (r.changes) { changed++; log(`  ↻ ${u.name}: ${u.lastNews || u.valuationLabel || u.nextRound || ""}`); }
}
db.close();
log(`ИТОГО обновлено: ${changed} (новостей найдено: ${updates.length})`);

// Пуш на прод только при реальных изменениях
if (changed > 0) {
  try {
    execSync("git add dev.db", { cwd: ROOT });
    execSync('git -c user.name="preipo-kb" -c user.email="kb@pre-ipo.pro" commit -m "Авто-обновление базы pre-IPO (оценки/новости)"', { cwd: ROOT, stdio: "ignore" });
    execSync("git push origin main", { cwd: ROOT, stdio: "ignore" });
    log("Запушено на прод");
  } catch (e) { log("git: " + (e instanceof Error ? e.message : e)); }
}
process.exit(0);
