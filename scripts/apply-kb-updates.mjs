import Database from "better-sqlite3";
import { readFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
const db = new Database("dev.db");
const cid = () => "c" + Date.now().toString(36) + randomBytes(7).toString("hex");
const now = () => new Date().toISOString().replace("Z","+00:00");

// --- обновления из патчей (по имени) ---
let updated = 0, missing = [];
const upd = db.prepare(`UPDATE KbCompany SET
  valuationLabel=COALESCE(@valuationLabel,valuationLabel),
  valuationUSD=COALESCE(@valuationUSD,valuationUSD),
  nextRound=COALESCE(@nextRound,nextRound),
  lastNews=COALESCE(@lastNews,lastNews),
  lastNewsUrl=COALESCE(@lastNewsUrl,lastNewsUrl),
  updatedAt=@now WHERE name=@name`);
for (const f of ["docs/kb-patch-1.json","docs/kb-patch-2.json","docs/kb-patch-3.json"]) {
  if (!existsSync(f)) continue;
  const arr = JSON.parse(readFileSync(f,"utf8"));
  for (const p of arr) {
    const r = upd.run({ name:p.name, valuationLabel:p.valuationLabel??null, valuationUSD:p.valuationUSD??null,
      nextRound:p.nextRound??null, lastNews:p.lastNews??null, lastNewsUrl:p.lastNewsUrl??null, now:now() });
    if (r.changes) updated++; else missing.push(p.name);
  }
}
console.log("Обновлено из патчей:", updated, missing.length?("| не найдены: "+missing.join(", ")):"");

// --- вставка новых компаний (ClickHouse) ---
function insertKb(c, order) {
  const site = (c.website||"").replace(/^https?:\/\//,"").replace(/\/.*$/,"");
  db.prepare(`INSERT INTO KbCompany (id,name,segment,website,logoUrl,founded,valuationUSD,valuationLabel,lastRound,nextRound,lastNews,lastNewsUrl,rounds,oneLiner,business,plans,analysis,sourceName,sourceUrl,"order",isActive,createdAt,updatedAt)
    VALUES (@id,@name,@segment,@website,@logoUrl,@founded,@valuationUSD,@valuationLabel,@lastRound,@nextRound,@lastNews,@lastNewsUrl,@rounds,@oneLiner,@business,@plans,@analysis,@sourceName,@sourceUrl,@order,1,@now,@now)`).run({
    id:cid(), name:c.name, segment:c.segment||null, website:site||null,
    logoUrl: site?`https://www.google.com/s2/favicons?domain=${site}&sz=128`:null,
    founded:c.founded!=null?String(c.founded):null, valuationUSD:c.valuationUSD??null, valuationLabel:c.valuationLabel||null,
    lastRound:c.lastRound||null, nextRound:c.nextRound||null, lastNews:c.lastNews||null, lastNewsUrl:c.lastNewsUrl||null,
    rounds:JSON.stringify(c.rounds||[]), oneLiner:c.oneLiner||null, business:c.business||null, plans:c.plans||null,
    analysis:c.analysis||null, sourceName:c.sourceName||null, sourceUrl:c.sourceUrl||null, order:order, now:now() });
}
if (existsSync("docs/kb-clickhouse.json")) {
  let ch = JSON.parse(readFileSync("docs/kb-clickhouse.json","utf8"));
  if (Array.isArray(ch)) ch = ch[0];
  const exists = db.prepare("SELECT 1 FROM KbCompany WHERE name=?").get(ch.name);
  if (!exists) { insertKb(ch, 999); console.log("Вставлена компания:", ch.name); }
  else console.log(ch.name, "уже есть — пропуск");
}
console.log("Всего в базе:", db.prepare("SELECT count(*) c FROM KbCompany").get().c);
