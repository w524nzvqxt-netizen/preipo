import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const db = new Database("dev.db");
const cid = () => "c" + Date.now().toString(36) + randomBytes(7).toString("hex");

let all = [];
for (const f of ["foundation","robotics","infra","apps"]) {
  const arr = JSON.parse(readFileSync(`docs/kb-${f}.json`, "utf8"));
  all = all.concat(arr);
}
// дедуп по имени (первый выигрывает)
const seen = new Set(); const uniq = [];
for (const c of all) { const k=(c.name||"").toLowerCase().trim(); if(!k||seen.has(k))continue; seen.add(k); uniq.push(c); }
// сортировка по оценке (убыв.) → order
uniq.sort((a,b)=>(b.valuationUSD||0)-(a.valuationUSD||0));

const now = new Date().toISOString().replace("Z","+00:00");
db.exec("DELETE FROM KbCompany"); // чистое наполнение
const ins = db.prepare(`INSERT INTO KbCompany
 (id,name,segment,website,logoUrl,founded,valuationUSD,valuationLabel,lastRound,rounds,oneLiner,business,plans,analysis,sourceName,sourceUrl,"order",isActive,createdAt,updatedAt)
 VALUES (@id,@name,@segment,@website,@logoUrl,@founded,@valuationUSD,@valuationLabel,@lastRound,@rounds,@oneLiner,@business,@plans,@analysis,@sourceName,@sourceUrl,@order,1,@now,@now)`);
let i=0;
for (const c of uniq) {
  const site = (c.website||"").replace(/^https?:\/\//,"").replace(/\/.*$/,"");
  ins.run({
    id: cid(), name: c.name, segment: c.segment||null, website: site||null,
    logoUrl: site ? `https://www.google.com/s2/favicons?domain=${site}&sz=128` : null,
    founded: c.founded!=null ? String(c.founded) : null,
    valuationUSD: c.valuationUSD ?? null, valuationLabel: c.valuationLabel||null,
    lastRound: c.lastRound||null, rounds: JSON.stringify(c.rounds||[]),
    oneLiner: c.oneLiner||null, business: c.business||null, plans: c.plans||null,
    analysis: c.analysis||null, sourceName: c.sourceName||null, sourceUrl: c.sourceUrl||null,
    order: i++, now,
  });
}
const bySeg = db.prepare('SELECT segment, count(*) c FROM KbCompany GROUP BY segment').all();
console.log("Наполнено KbCompany:", db.prepare("SELECT count(*) c FROM KbCompany").get().c);
console.log(bySeg.map(s=>`  ${s.segment}: ${s.c}`).join("\n"));
