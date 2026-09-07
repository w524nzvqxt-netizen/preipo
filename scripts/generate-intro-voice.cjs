require('dotenv').config({quiet:true});const fs=require('fs');const path=require('path');
const script=require('../remotion/intro-script.json');
const dir=path.resolve('.video-tmp/intro-20260907');fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const sample=process.argv.includes('--sample');
 const scenes=sample?script.scenes.slice(0,1):script.scenes;
 for(const scene of scenes){
  const out=path.join(dir,scene.id+'.wav'),meta=path.join(dir,scene.id+'.json');
  if(fs.existsSync(out)){console.log('Cached',scene.id);continue;}
  const r=await fetch('https://api.heygen.com/v3/voices/speech',{method:'POST',headers:{'x-api-key':process.env.HEYGEN_API_KEY,'content-type':'application/json'},body:JSON.stringify({text:scene.narration,voice_id:script.voiceId,input_type:'text',speed:0.98,language:'ru'}),signal:AbortSignal.timeout(120000)});
  const data=await r.json();fs.writeFileSync(meta,JSON.stringify(data,null,2));
  if(!r.ok||!data.data?.audio_url)throw Error('Speech '+r.status+': '+JSON.stringify(data.error||data));
  const audio=await fetch(data.data.audio_url,{signal:AbortSignal.timeout(60000)});if(!audio.ok)throw Error('Audio download '+audio.status);
  fs.writeFileSync(out,Buffer.from(await audio.arrayBuffer()));console.log('Generated',scene.id,'duration',data.data.duration,'bytes',fs.statSync(out).size);
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
