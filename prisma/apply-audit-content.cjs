// One-time content correction. Does not touch leads, agents or sales.
const fs=require('fs');const path=require('path');
const db=require('better-sqlite3')(path.resolve((process.env.DATABASE_URL||'file:./dev.db').replace(/^file:/,'')));
db.exec('CREATE TABLE IF NOT EXISTS ContentPatch (id TEXT PRIMARY KEY, appliedAt TEXT NOT NULL)');
const key='audit-2026-09-07-v1';
if(!db.prepare('SELECT id FROM ContentPatch WHERE id=?').get(key))db.transaction(()=>{
 const analyses=JSON.parse(fs.readFileSync(path.join(__dirname,'analyses.json'),'utf8'));
 for(const p of db.prepare('SELECT * FROM Project').all()){
  if(analyses[p.name])db.prepare('UPDATE Project SET financialAnalysis=? WHERE id=?').run(JSON.stringify(analyses[p.name]),p.id);
  let scenarios;try{scenarios=JSON.parse(p.scenarios)}catch{}
  if(Array.isArray(scenarios)){
   scenarios=scenarios.map(s=>({...s,key:s.color==='amber'?'Пессимистичный':s.color==='sky'?'Базовый':'Оптимистичный'}));
   db.prepare('UPDATE Project SET scenarios=? WHERE id=?').run(JSON.stringify(scenarios),p.id);
  }
  if(p.name==='Cursor')db.prepare('UPDATE Project SET description=?, expectedExit=NULL, expectedReturn=NULL, cocMultiple=NULL, exitValuation=NULL, scenarios=NULL, videoUrl=NULL, videoScript=NULL, videoStatus=?, dealStatus=? WHERE id=?').run(analyses.Cursor.execSummary,'archived','closed',p.id);
  // Superseded MP4 files are archived until the corrected narration is rendered.
  else if(p.videoUrl)db.prepare('UPDATE Project SET videoUrl=NULL, videoStatus=? WHERE id=?').run('needs_review',p.id);
  if(p.videoScript && p.name!=='Cursor'){
   let scenes;try{scenes=JSON.parse(p.videoScript)}catch{}
   if(Array.isArray(scenes)){
    for(const scene of scenes)if(typeof scene.narration==='string' && /ARR/.test(JSON.stringify(scene)))scene.narration+=' ARR — годовой темп регулярной выручки, а не фактически признанная выручка за полный год.';
    db.prepare('UPDATE Project SET videoScript=? WHERE id=?').run(JSON.stringify(scenes),p.id);
   }
  }
 }
 for(const doc of db.prepare("SELECT id,fileUrl FROM ProjectDocument WHERE fileUrl LIKE '/uploads/analysis/%'").all()){
  const revised=doc.fileUrl.replace(/\.pdf$/,'-20260907.pdf');
  const disk=path.resolve('public'+revised);
  if(fs.existsSync(disk))db.prepare('UPDATE ProjectDocument SET fileUrl=?,sizeBytes=? WHERE id=?').run(revised,fs.statSync(disk).size,doc.id);
 }
 db.prepare('INSERT INTO ContentPatch VALUES (?,?)').run(key,new Date().toISOString());
 console.log('[content] Audit corrections applied');
})();
else console.log('[content] Audit corrections already applied');
db.close();
