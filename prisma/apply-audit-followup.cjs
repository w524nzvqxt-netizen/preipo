const path=require('path');const fs=require('fs');
const db=require('better-sqlite3')(path.resolve((process.env.DATABASE_URL||'file:./dev.db').replace(/^file:/,'')));
const key='audit-2026-09-07-v2';
if(!db.prepare('SELECT id FROM ContentPatch WHERE id=?').get(key))db.transaction(()=>{
 for(const p of db.prepare('SELECT * FROM Project').all()){
  for(const field of ['description','salesPoints','pros','risks','videoScript']){
   let value=p[field];if(typeof value!=='string')continue;
   if(p.name==='OpenEvidence')value=value.replaceAll('+15%','+20,83%').replaceAll('премия 15%','премия 20,83%');
   if(p.name==='Cashea')value=value.replace(/P\/S\s*1[.,]2[xх×]?/g,'P/S 2025: 3,77×').replace(/P\/E\s*8(?:[.,]0)?[xх×]?/g,'P/E 2025: 16,41×').replace(/(?:всего|совокупно)\s*\$22[.,]5\s*(?:M|млн)/g,'$22,5 млн по историческому срезу до сообщения о $100 млн финансирования в июле 2026');
   if(value!==p[field])db.prepare(`UPDATE Project SET ${field}=? WHERE id=?`).run(value,p.id);
  }
 }
 for(const p of db.prepare('SELECT id,name,sourceUrl,lastNewsUrl FROM KbCompany').all()){
  for(const field of ['sourceUrl','lastNewsUrl'])if(p[field] && (/valueaddvc.com\/pulse\/baseten-1-5b-series-f-inference-2026/.test(p[field])||/indiaipo/.test(p[field])&&/Zepto/i.test(p.name)))db.prepare(`UPDATE KbCompany SET ${field}=NULL WHERE id=?`).run(p.id);
  if(/cursor|anysphere/i.test(p.name))db.prepare('UPDATE KbCompany SET nextRound=NULL,plans=?,lastNews=?,lastNewsUrl=? WHERE id=?').run('Архив частного раунда: самостоятельный сценарий IPO снят после приобретения SpaceX.','14.08.2026: Cursor объявила о завершении приобретения SpaceX.','https://prod.cursor.com/blog/joining-spacex',p.id);
 }
 // Display the audited addendum with the original deal material.
 const blue=db.prepare("SELECT id FROM Project WHERE name LIKE 'Blue%'").get();
 const fileUrl='/uploads/analysis/blue-origin-errata-20260907.pdf';
 if(blue&&fs.existsSync(path.resolve('public'+fileUrl)))db.prepare('INSERT INTO ProjectDocument (id,projectId,title,kind,fileUrl,fileName,sizeBytes,createdAt) VALUES (?,?,?,?,?,?,?,?)').run('audit-blue-origin-20260907',blue.id,'Уточнения к презентации · 07.09.2026','analysis',fileUrl,path.basename(fileUrl),fs.statSync(path.resolve('public'+fileUrl)).size,new Date().toISOString());
 db.prepare('INSERT INTO ContentPatch VALUES (?,?)').run(key,new Date().toISOString());
 console.log('[content] Follow-up corrections applied');
})();else console.log('[content] Follow-up corrections already applied');
db.close();
