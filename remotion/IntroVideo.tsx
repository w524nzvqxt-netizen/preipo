import React from "react";
import { AbsoluteFill, Audio, Series, interpolate, spring, staticFile, useCurrentFrame } from "remotion";

export type IntroSceneData = { id: string; kicker: string; title: string; narration: string; audio: string; frames: number; cues: { text: string; from: number; to: number }[] };
const C = { bg: "#09121b", panel: "#13232f", line: "#39505d", white: "#f3f0e7", muted: "#9cabb2", gold: "#dac28a", red: "#ed9d91", teal: "#85c1b4" };
const font = "Arial, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
function enter(f: number, delay = 0) { return spring({ frame: f - delay, fps: 30, config: { damping: 25, stiffness: 110, mass: 0.8 } }); }
function Label({x,y,children,size=30,color=C.white,weight=400,anchor="start"}: {x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:"start"|"middle"|"end"}) { return <text x={x} y={y} fontFamily={font} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor}>{children}</text>; }
function Dot({x,y,r=7,color=C.gold}:{x:number;y:number;r?:number;color?:string}){return <g><circle cx={x} cy={y} r={r*3} fill={color} opacity={.07}/><circle cx={x} cy={y} r={r} fill={color}/></g>;}
function Line({d,f,delay=0,color=C.gold,width=3}:{d:string;f:number;delay?:number;color?:string;width?:number}) { return <path d={d} fill="none" stroke={color} strokeWidth={width} pathLength={1} strokeDasharray={1} strokeDashoffset={1-enter(f,delay)} strokeLinecap="round"/>; }
function Card({x,y,w,h=120,children,f,delay=0}:{x:number;y:number;w:number;h?:number;children:React.ReactNode;f:number;delay?:number}) { const t=enter(f,delay);return <g opacity={t} transform={`translate(${x} ${y+(1-t)*24})`}><rect width={w} height={h} rx={14} fill={C.panel} stroke={C.line}/>{children}</g>; }
function Diamond({x,y,size=15}:{x:number;y:number;size?:number}){return <path d={`M${x} ${y-size}L${x+size} ${y}L${x} ${y+size}L${x-size} ${y}Z`} fill={C.gold}/>;}

function Visual({id,f}:{id:string;f:number}){
 if(id==="intro") return <g>
  <ellipse cx={1400} cy={751} rx={360} ry={82} fill="#213844" opacity={.42}/>
  <path d="M1005 758 L1340 542 L1790 699 L1460 916 Z" fill="none" stroke={C.line} strokeWidth={1.5}/>
  {[0,1,2].map((n)=><g key={n} opacity={enter(f,10+n*6)} transform={`translate(${1060+n*190} ${680-n*50+(1-enter(f,10+n*6))*85})`}>
   <path d="M0 0 L102 -55 L180 -14 L78 45 Z" fill={n===2?C.gold:"#385561"}/>
   <path d={`M0 0 V${160+n*20} L78 ${205+n*20} V45 Z`} fill={n===2?"#947c4b":"#1c3544"}/>
   <path d={`M78 45 L180 -14 V${146+n*20} L78 ${205+n*20}Z`} fill={n===2?"#b49b65":"#294855"}/>
   {[0,1,2].map(k=><path key={k} d={`M95 ${64+k*35}L160 ${27+k*35}`} stroke={n===2?"#e9dab7":"#5d7984"} strokeWidth={3}/>)}
  </g>)}
  <Line d="M995 818 C1160 850 1350 810 1550 700" f={f} delay={28}/>
  <g opacity={enter(f,22)}><path d="M1630 330V790" stroke={C.gold} strokeWidth={2} strokeDasharray="7 12"/><Label x={1630} y={298} size={27} color={C.gold} anchor="middle">IPO</Label><Label x={1630} y={838} size={24} color={C.muted} anchor="middle">возможный выход</Label></g>
  <g opacity={enter(f,40)}><rect x={1015} y={376} width={371} height={58} rx={29} fill={C.gold}/><Label x={1200} y={414} size={26} color={C.bg} weight={700} anchor="middle">ЧАСТНАЯ КОМПАНИЯ</Label></g>
 </g>;
 if(id==="business") return <g>
  <circle cx={1390} cy={595} r={209} fill="none" stroke={C.line} strokeWidth={1}/><circle cx={1390} cy={595} r={263} fill="none" stroke={C.line} strokeWidth={1} strokeDasharray="2 12"/>
  <Line d="M1390 505V380M1288 640L1100 727M1492 640L1690 727" f={f} delay={14}/>
  <g opacity={enter(f)}><circle cx={1390} cy={595} r={112} fill={C.panel} stroke={C.gold} strokeWidth={2}/><Diamond x={1390} y={565} size={22}/><Label x={1390} y={627} size={30} anchor="middle" weight={700}>БИЗНЕС</Label></g>
  <Card x={1235} y={294} w={310} h={106} f={f} delay={18}><Label x={155} y={64} size={32} anchor="middle">Продукт</Label></Card>
  <Card x={950} y={724} w={310} h={106} f={f} delay={30}><Label x={155} y={64} size={32} anchor="middle">Клиенты</Label></Card>
  <Card x={1550} y={724} w={310} h={106} f={f} delay={42}><Label x={155} y={64} size={32} anchor="middle">Выручка</Label></Card>
  {[0,1,2].map(n=>{const a=f/150+n*Math.PI*2/3;return <Dot key={n} x={1390+209*Math.cos(a)} y={595+209*Math.sin(a)} r={5}/>;})}
 </g>;
 if(id==="deal") return <g>
  <Line d="M1025 420H1660" f={f} delay={20} color={C.line}/>
  <g opacity={enter(f,4)}><circle cx={1025} cy={420} r={55} fill={C.panel} stroke={C.gold}/><circle cx={1025} cy={403} r={13} stroke={C.gold} fill="none" strokeWidth={3}/><path d="M1000 442Q1025 406 1050 442" stroke={C.gold} fill="none" strokeWidth={3}/><Label x={1025} y={522} anchor="middle" size={27}>Инвестор</Label></g>
  <g opacity={enter(f,22)}><rect x={1290} y={345} width={110} height={145} rx={9} fill={C.panel} stroke={C.gold} strokeWidth={2}/>{[0,1,2,3].map(n=><path key={n} d={`M1310 ${375+n*23}H${n===3?1360:1380}`} stroke={C.muted} strokeWidth={3}/>)}<Label x={1345} y={522} anchor="middle" size={27}>Документы</Label></g>
  <g opacity={enter(f,37)}><circle cx={1660} cy={420} r={68} fill="none" stroke={C.line} strokeWidth={22}/><circle cx={1660} cy={420} r={68} fill="none" stroke={C.gold} strokeWidth={22} strokeDasharray="110 427" transform="rotate(-90 1660 420)"/><Label x={1660} y={522} anchor="middle" size={27}>Доля</Label></g>
  <Card x={967} y={640} w={795} h={178} f={f} delay={48}>{["Права на долю","Комиссии","Продажа"].map((v,n)=><g key={v}><Dot x={36+n*255} y={66} r={5}/><Label x={28+n*255} y={112} size={25}>{v}</Label></g>)}</Card>
 </g>;
 if(id==="value") return <g>
  <Card x={963} y={310} w={817} h={120} f={f}><Label x={35} y={49} size={23} color={C.muted}>ОЦЕНКА КОМПАНИИ</Label><Line d="M425 88L498 68L564 75L640 44L733 19" f={f} delay={10} color={C.teal}/><Label x={35} y={91} size={30}>Не равна доходности доли</Label></Card>
  <Line d="M1060 479V796H1610" f={f} delay={22} color={C.line}/>
  {[[1125,540,180,"Стоимость доли",C.teal],[1338,640,80,"Расходы",C.muted],[1551,620,100,"Ваш итог",C.gold]].map(([x,y,h,label,color],n)=><g key={String(label)} opacity={enter(f,28+n*10)}><rect x={Number(x)} y={Number(y)} width={135} height={Number(h)*enter(f,28+n*10)} rx={4} fill={String(color)}/><Label x={Number(x)+67} y={764} size={23} anchor="middle">{label}</Label></g>)}
  <Label x={963} y={868} size={25} color={C.muted}>Схема: комиссии, налоги, новые выпуски акций</Label>
 </g>;
 if(id==="exit") return <g>
  <g opacity={enter(f)}><circle cx={1070} cy={573} r={75} fill={C.panel} stroke={C.gold}/><Diamond x={1070} y={554} size={17}/><Label x={1070} y={605} size={27} anchor="middle">Доля</Label></g>
  {[340,570,800].map((y,n)=><g key={y}><Line d={`M1145 573C1310 573 1230 ${y} 1410 ${y}`} f={f} delay={15+n*9}/><Card x={1410} y={y-67} w={368} h={134} f={f} delay={22+n*9}><Label x={28} y={54} size={33} weight={700}>{["IPO","Покупка компании","Вторичный рынок"][n]}</Label><Label x={28} y={96} size={23} color={C.muted}>{["Выход на биржу","Сделка M&A","Продажа своей доли"][n]}</Label></Card></g>)}
 </g>;
 if(id==="risk") return <g>
  <path d="M980 735H1770M980 360V735" stroke={C.line} fill="none"/>
  <Line d="M995 415C1110 370 1180 435 1300 508S1540 688 1750 735" f={f} delay={8} color={C.red} width={5}/>
  <Dot x={1750} y={735} color={C.red} r={9}/>
  <g opacity={enter(f,20)}><Label x={970} y={598} size={154} color={C.red} weight={700}>0</Label><Label x={978} y={654} size={29} color={C.red}>Возможный исход</Label></g>
  <Label x={980} y={812} size={27} color={C.muted}>Нет гарантии возврата вложений</Label>
 </g>;
 return <g opacity={enter(f,7)}>
  <g transform={`translate(1390 540) rotate(${f/25})`}><rect x={-155} y={-155} width={310} height={310} rx={34} fill="none" stroke={C.line} strokeWidth={2}/><rect x={-118} y={-118} width={236} height={236} rx={23} fill="none" stroke={C.gold} strokeWidth={2}/></g>
  <Diamond x={1390} y={540} size={68}/><Label x={1390} y={802} size={43} weight={700} anchor="middle" color={C.gold}>pre-ipo.pro</Label><Label x={1390} y={853} size={27} anchor="middle" color={C.muted}>Telegram · @preipopro</Label>
 </g>;
}

function Scene({scene,index}:{scene:IntroSceneData;index:number}){
 const f=useCurrentFrame();const opacity=interpolate(f,[0,12,scene.frames-13,scene.frames],[0,1,1,0],clamp);
 const cue=scene.cues.find(c=>f>=c.from&&f<c.to);
 const title=scene.title.split("\n");
 return <AbsoluteFill>
  <Audio src={staticFile(scene.audio)}/>
  <svg viewBox="0 0 1920 1080" style={{width:"100%",height:"100%",fontFamily:font}}>
   <defs><radialGradient id="halo"><stop stopColor="#19333f" stopOpacity=".8"/><stop offset="1" stopColor={C.bg} stopOpacity="0"/></radialGradient><linearGradient id="fade"><stop stopColor={C.gold}/><stop offset="1" stopColor={C.gold} stopOpacity=".1"/></linearGradient></defs>
   <rect width={1920} height={1080} fill={C.bg}/><ellipse cx={1430} cy={480} rx={780} ry={600} fill="url(#halo)"/>
   {[0,1,2,3,4,5].map(n=><path key={n} d={`M${950+n*190} 0V1080`} stroke={C.line} opacity={.09}/>)}
   <Diamond x={115} y={78} size={14}/><Label x={150} y={88} size={28} weight={700}>PRE-IPO.PRO</Label><Label x={1804} y={88} size={23} anchor="end" color={C.muted}>ОСНОВЫ ИНВЕСТИРОВАНИЯ</Label>
   <path d="M112 122H1808" stroke={C.line} opacity={.7}/>
   <g opacity={opacity}>
    <Label x={112} y={253} size={25} color={C.gold}>{scene.kicker}</Label>
    {title.map((line,n)=><g key={line} opacity={enter(f,n*6)} transform={`translate(0 ${(1-enter(f,n*6))*25})`}><Label x={106} y={377+n*108} size={83} weight={700}>{line}</Label></g>)}
    <path d="M112 567H244" stroke={index===5?C.red:C.gold} strokeWidth={4}/>
    <Label x={112} y={642} size={29} color={C.muted}>{["Доля в частной компании","Продукт · клиенты · выручка","Изучить до подписания","Считать по условиям сделки","Срок не гарантирован","Высокий риск · низкая ликвидность","Начните с материалов сделки"][index]}</Label>
    <Visual id={scene.id} f={f}/>
   </g>
   <path d="M112 919H1808" stroke={C.line}/>
   {Array.from({length:7},(_,n)=><rect key={n} x={112+n*38} y={877} width={26} height={4} rx={2} fill={n<=index?C.gold:C.line}/>)}
  </svg>
  <div style={{position:"absolute",left:112,right:112,bottom:36,height:96,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:font,fontSize:31,lineHeight:1.36,color:C.white,textAlign:"center"}}>{cue?.text}</div>
  {index===6&&<div style={{position:"absolute",left:112,top:704,width:680,fontFamily:font,fontSize:25,lineHeight:1.45,color:C.muted,opacity:enter(f,20)}}>Не является индивидуальной инвестиционной рекомендацией. Инвестиции в pre-IPO высокорисковые.</div>}
 </AbsoluteFill>;
}
export const IntroVideo:React.FC<{scenes:IntroSceneData[]}>=({scenes})=><AbsoluteFill style={{background:C.bg}}><Series>{scenes.map((scene,index)=><Series.Sequence key={scene.id} durationInFrames={scene.frames}><Scene scene={scene} index={index}/></Series.Sequence>)}</Series></AbsoluteFill>;
