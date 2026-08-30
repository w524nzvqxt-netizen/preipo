import { readFileSync, writeFileSync } from "node:fs";
const html = readFileSync("ChatExport_2026-08-31/messages.html", "utf8");
function decode(s){return s.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();}
const blocks = html.split(/<div class="message default/).slice(1);
const posts = [];
let curDate = "";
for (const b of blocks) {
  const dm = b.match(/date details"[^>]*title="([^"]+)"/);
  if (dm) curDate = dm[1];
  const tm = b.match(/<div class="text">([\s\S]*?)<\/div>/);
  const text = tm ? decode(tm[1]) : "";
  const files = [...b.matchAll(/<div class="title bold">([^<]+)<\/div>/g)].map(m=>m[1].trim()).filter(x=>x&&!/^\d+$/.test(x));
  if (text || files.length) posts.push({ date: curDate.slice(0,16), text, files });
}
const out = posts.map((p,i)=>`##### [${i+1}] ${p.date}${p.files.length?" · вложения: "+p.files.join(" | "):""}\n${p.text}`).join("\n\n");
writeFileSync("docs/finsight-channel.txt", out, "utf8");
console.log("постов:", posts.length, "| символов:", out.length);
// теги-статистика
const tags = {};
for (const p of posts) for (const t of (p.text.match(/#[A-Za-zА-Яа-я_0-9]+/g)||[])) tags[t]=(tags[t]||0)+1;
console.log("топ-теги:", Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([k,v])=>`${k}:${v}`).join("  "));
