import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const db = new Database("dev.db");
const cid = () => "c" + Date.now().toString(36) + randomBytes(7).toString("hex");
const now = new Date().toISOString().replace("Z","+00:00");
const shortLabel = (l) => { if(!l) return null; const m=l.match(/≈?\s*\$[\d.,]+\s*(?:трлн|млрд|млн|тыс)/); return m?m[0].replace(/\s+/g," ").trim():l; };

const arr = JSON.parse(readFileSync("docs/kb-finsight.json","utf8"));
const have = new Set(db.prepare("SELECT lower(name) n FROM KbCompany").all().map(x=>x.n));
const maxOrder = db.prepare('SELECT COALESCE(MAX("order"),0) m FROM KbCompany').get().m;
let ord = maxOrder + 1, ins = 0, skip = 0;

const stmt = db.prepare(`INSERT INTO KbCompany (id,name,segment,website,logoUrl,founded,valuationUSD,valuationLabel,lastRound,nextRound,lastNews,lastNewsUrl,rounds,oneLiner,business,plans,analysis,sourceName,sourceUrl,"order",isActive,createdAt,updatedAt)
 VALUES (@id,@name,@segment,@website,@logoUrl,@founded,@valuationUSD,@valuationLabel,@lastRound,@nextRound,@lastNews,@lastNewsUrl,@rounds,@oneLiner,@business,@plans,@analysis,@sourceName,@sourceUrl,@order,1,@now,@now)`);

for (const c of arr) {
  if (have.has((c.name||"").toLowerCase())) { skip++; continue; }
  const site = (c.website||"").replace(/^https?:\/\//,"").replace(/\/.*$/,"");
  stmt.run({ id:cid(), name:c.name, segment:c.segment||null, website:site||null,
    logoUrl: site?`https://www.google.com/s2/favicons?domain=${site}&sz=128`:null,
    founded:c.founded!=null?String(c.founded):null, valuationUSD:c.valuationUSD??null,
    valuationLabel: shortLabel(c.valuationLabel), lastRound:c.lastRound||null, nextRound:c.nextRound||null,
    lastNews:c.lastNews||null, lastNewsUrl:c.lastNewsUrl||null, rounds:JSON.stringify(c.rounds||[]),
    oneLiner:c.oneLiner||null, business:c.business||null, plans:c.plans||null, analysis:c.analysis||null,
    sourceName:c.sourceName||null, sourceUrl:c.sourceUrl||null, order:ord++, now });
  ins++;
}
console.log(`Вставлено: ${ins}, пропущено (дубли): ${skip}`);
const seg = db.prepare('SELECT segment, count(*) c FROM KbCompany WHERE isActive=1 GROUP BY segment ORDER BY c DESC').all();
console.log("Сегменты:", seg.map(s=>`${s.segment}:${s.c}`).join("  "));
console.log("Всего активных:", db.prepare("SELECT count(*) c FROM KbCompany WHERE isActive=1").get().c);
