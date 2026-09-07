const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const script=require('../remotion/intro-script.json');
const dir=path.resolve('.video-tmp',script.assetVersion);fs.mkdirSync(dir,{recursive:true});
const python=process.env.INTRO_PYTHON||'python';
const scenes=process.argv.includes('--sample')?script.scenes.slice(0,1):script.scenes;
for(const scene of scenes){
 const out=path.join(dir,scene.id+'.wav'),meta=path.join(dir,scene.id+'.json');
 const request={text:scene.narration,voice:script.voiceId,rate:script.voiceRate};
 const fingerprint=createHash('sha256').update(JSON.stringify(request)).digest('hex');
 if(fs.existsSync(out)&&fs.existsSync(meta)&&JSON.parse(fs.readFileSync(meta,'utf8')).fingerprint===fingerprint){console.log('Cached',scene.id);continue;}
 const textFile=path.join(dir,scene.id+'.txt'),mp3=path.join(dir,scene.id+'.mp3');fs.writeFileSync(textFile,scene.narration);
 execFileSync(python,['-m','edge_tts','--voice',script.voiceId,'--rate='+script.voiceRate,'--file',textFile,'--write-media',mp3],{stdio:'inherit',timeout:120000});
 execFileSync(require('ffmpeg-static'),['-y','-v','error','-i',mp3,'-ar','48000','-ac','1',out],{stdio:'inherit'});
 fs.writeFileSync(meta,JSON.stringify({...request,fingerprint,engine:'Microsoft Edge neural TTS'},null,2));console.log('Generated',scene.id,fs.statSync(out).size);
}
