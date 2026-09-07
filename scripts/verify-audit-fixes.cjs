const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file,extra={}){const exports={};const env={ADMIN_PASSWORD:'audit-test-password',SESSION_SECRET:'audit-test-secret-for-regression',ADMIN_PASSWORD_HASHES:''};const ctx={exports,require,...extra,process:{env},Buffer,console};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,ctx);return {exports,env};}
(async()=>{
 const calc=load('src/lib/agent-calc.ts').exports;
 const base={amount:100000,expMultiple:0.5,sf:0,entryFee:0,commission:0,yearsToExit:5,commissionPaid:false};
 assert.equal(calc.saleMetrics(base).clientNet,-50000);
 assert.equal(calc.saleMetrics({...base,expMultiple:0}).clientNet,-100000);
 assert.equal(calc.portfolio([base]).clientProfit,-50000);
 const s=load('src/lib/scenarios.ts').exports;
 assert.equal(s.parseScenarios('bad'),null);
 assert.equal(s.parseScenarios('[{"color":"amber","mult":1}]'),null);
 assert.equal(s.parseScenarios(JSON.stringify([{color:'amber',mult:0},{color:'sky',mult:2},{color:'emerald',mult:3}]))[0].val,0);
 assert.ok(s.exitPeriodStart('H1 2028')<s.exitPeriodStart('H2 2028'));
 assert.ok(s.exitPeriodStart('1Q2030')<s.exitPeriodStart('Q2 2030'));
 let cookie;
 const auth=load('src/lib/auth.ts',{require:n=>n==='next/headers'?{cookies:async()=>({set:(n,v)=>cookie=v,get:()=>({value:cookie})})}:require(n)});
 assert.ok(auth.exports.checkPassword('audit-test-password'));
 assert.equal(auth.exports.checkPassword('wrong'),false);
 await auth.exports.setSession();assert.ok(await auth.exports.isAuthed());
 auth.env.ADMIN_PASSWORD='rotated-test-password';assert.equal(await auth.exports.isAuthed(),false);
 const idx=load('src/lib/exit-index.ts').exports;
 const input=[{currentMarketCapUSD:0,rounds:[{valuationUSD:100,year:2020},{valuationUSD:100,year:null}]}];
 assert.equal(idx.computeExitIndex(input).count,1);
 assert.equal(idx.computeExitIndex(input).preIpoValue,0);
 assert.equal(idx.computeExitIndexSeries(input)[0].invested,idx.computeExitIndex(input).invested);
 const urls=['/','/news','/portfolio','/exits','/academy','/sitemap.xml','/robots.txt',...['do-birzhi','razum-mashin'].flatMap(s=>['html','pdf','epub'].map(e=>'/books/'+s+'.'+e))];
 const status=[];for(const url of urls){const r=await fetch('http://localhost:3197'+url);assert.equal(r.status,200,url);status.push({url,status:r.status});if(url==='/'||url==='/news')assert.ok((await r.text()).includes('https://t.me/preipopro'));}
 fs.writeFileSync('audit-2026-09-07/fixes-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),regressions:'passed',status},null,2));
 console.log('Regression checks passed; all '+urls.length+' routes return 200; Telegram link present.');
})().catch(e=>{console.error(e);process.exitCode=1});
