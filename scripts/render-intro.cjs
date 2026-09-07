const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const {bundle}=require('@remotion/bundler');const {selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const FF=require('ffmpeg-static');const script=require('../remotion/intro-script.json');
const version=script.assetVersion;const ROOT=path.resolve('.video-tmp',version);const audioDir=path.resolve('public/uploads/v2',version);fs.mkdirSync(audioDir,{recursive:true});
const fps=30;
function probe(file){try{execFileSync(FF,['-i',file],{stdio:['ignore','ignore','pipe']});}catch(e){const m=/Duration: (\d+):(\d+):(\d+\.\d+)/.exec(String(e.stderr));if(m)return +m[1]*3600 + +m[2]*60 + +m[3];}throw Error('No duration '+file);}
function chunks(text){const sentences=text.replace('При-ай-пи-о','Pre-IPO').match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];const out=[];for(const sentence of sentences){let cur='';for(const word of sentence.trim().split(' ')){if((cur+' '+word).length>84){out.push(cur);cur=word;}else cur+=(cur?' ':'')+word;}if(cur)out.push(cur);}return out;}
function stamp(sec){const ms=Math.round(sec*1000);return new Date(ms).toISOString().slice(11,23);}
(async()=>{
 const scenes=[];let time=0;let vtt='WEBVTT\n\n';
 for(const s of script.scenes){
  const raw=path.join(ROOT,s.id+'.wav'),out=path.join(audioDir,s.id+'.mp3');const duration=probe(raw);
  execFileSync(FF,['-y','-i',raw,'-af','highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=7,adelay=300,apad=pad_dur=0.4','-ar','48000','-ac','2','-codec:a','libmp3lame','-b:a','192k',out],{stdio:'ignore'});
  const parts=chunks(s.narration),length=parts.reduce((a,p)=>a+p.length,0);let elapsed=.3;
  const cues=parts.map(text=>{const from=elapsed;elapsed+=duration*text.length/length;vtt+=`${stamp(time+from)} --> ${stamp(time+elapsed)}\n${text}\n\n`;return {text,from:Math.round(from*fps),to:Math.round(elapsed*fps)};});
  const frames=Math.ceil((duration+.7)*fps);scenes.push({...s,audio:'uploads/v2/'+version+'/'+s.id+'.mp3',frames,cues});time+=frames/fps;
 }
 const inputProps={scenes};fs.writeFileSync(path.join(ROOT,'render-props.json'),JSON.stringify(inputProps,null,2));fs.writeFileSync('public/uploads/preipo-intro-20260907-dmitry.vtt',vtt);
 console.log('Runtime',time.toFixed(1),'seconds; bundling');
 const serveUrl=await bundle({entryPoint:path.resolve('remotion/index.ts'),outDir:path.join(ROOT,'bundle')});
 const browserExecutable='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 const composition=await selectComposition({serveUrl,id:'IntroVideo',inputProps,browserExecutable});
 let offset=0;for(const [i,scene] of scenes.entries()){await renderStill({composition,serveUrl,inputProps,output:path.join(ROOT,'frame-'+i+'.png'),frame:offset+Math.min(100,scene.frames-20),browserExecutable});offset+=scene.frames;}
 console.log('Storyboard ready');
 if(process.argv.includes('--stills'))return;
 let last=-1;
 await renderMedia({composition,serveUrl,inputProps,outputLocation:path.join(ROOT,'master.mp4'),codec:'h264',crf:18,x264Preset:'medium',concurrency:4,browserExecutable,onProgress:p=>{const n=Math.floor(p.progress*10);if(n!==last){last=n;console.log('Render',n*10+'%');}}});
 execFileSync(FF,['-y','-i',path.join(ROOT,'master.mp4'),'-c','copy','-movflags','+faststart','public/uploads/preipo-intro-20260907-dmitry.mp4'],{stdio:'ignore'});
 await renderStill({composition,serveUrl,inputProps,output:'public/uploads/preipo-intro-20260907-dmitry-poster.jpg',imageFormat:'jpeg',frame:90,browserExecutable});
 console.log('Ready: public/uploads/preipo-intro-20260907-dmitry.mp4',fs.statSync('public/uploads/preipo-intro-20260907-dmitry.mp4').size);
})().catch(e=>{console.error(e);process.exitCode=1});
