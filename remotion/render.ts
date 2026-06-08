import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ffpath from "ffmpeg-static";

const FF = ffpath as unknown as string;
const FPS = 30;
const OUT = "/Users/pirskiyka/Desktop/pre ipo/Prometheus_Видео.mp4";

function frames(file: string): number {
  let stderr = "";
  try {
    execFileSync(FF, ["-i", file], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e: any) {
    stderr = String(e.stderr || "");
  }
  const m = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(stderr);
  if (!m) throw new Error("нет длительности: " + file);
  const sec = +m[1] * 3600 + +m[2] * 60 + +m[3];
  return Math.ceil(sec * FPS) + 6; // небольшой хвост
}

const A = (i: number) => `public/uploads/v2/audio/a${i}.mp3`;
const aud = (i: number) => `uploads/v2/audio/a${i}.mp3`;

const SC = [
  { v: { type: "video", src: "uploads/v2/clip-ailab.mp4", title: "Project Prometheus", subtitle: "AI для физической экономики" }, a: 0 },
  { v: { type: "video", src: "uploads/v2/clip-cad.mp4", caption: "Интеллект, проектирующий физические системы" }, a: 1 },
  { v: { type: "founders" }, a: 2 },
  { v: { type: "video", src: "uploads/v2/clip-datacenter.mp4", caption: "Команда из топ-AI-лабораторий мира" }, a: 3 },
  { v: { type: "video", src: "uploads/v2/clip-chip.mp4", caption: "Технология · ускорение до 1 000 000×" }, a: 4 },
  { v: { type: "video", src: "uploads/v2/clip-aero.mp4", caption: "Рынок: промышленность, аэрокосмос, чипы" }, a: 5 },
  { v: { type: "metrics", title: "Оценка и прогноз", rows: [["Оценка входа", "$46 млрд"], ["Выход на биржу", "H2 2029"], ["Доходность (базовый)", "+51% / год"], ["Net CoC", "×3,5"]] }, a: 6 },
  { v: { type: "scenarios", items: [
    { k: "Лучший", val: 1495894, mult: 14.96, irr: "+128%/год", color: "#34D399" },
    { k: "Базовый", val: 350082, mult: 3.5, irr: "+51%/год", color: "#38BDF8" },
    { k: "Худший", val: 84520, mult: 0.85, irr: "−3,2%/год", color: "#FBBF24" },
  ] }, a: 7 },
  { v: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Войдите до выхода на биржу", subtitle: "Pre-IPO Витрина" }, a: 8 },
];

(async () => {
  const scenes = SC.map((s) => ({
    durationInFrames: frames(A(s.a)),
    audio: aud(s.a),
    visual: s.v,
  }));
  const total = scenes.reduce((x, s) => x + s.durationInFrames, 0);
  console.log("Сцен:", scenes.length, "| кадров:", total, "| ~", Math.round(total / FPS), "сек");

  console.log("Бандл...");
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts") });

  console.log("Выбор композиции...");
  const composition = await selectComposition({
    serveUrl,
    id: "CompanyVideo",
    inputProps: { scenes },
  });

  console.log("Рендер (может скачать headless-браузер при первом запуске)...");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: OUT,
    inputProps: { scenes },
    concurrency: 2,
  });
  console.log("Готово:", OUT);
  process.exit(0);
})().catch((e) => {
  console.error("ОШИБКА:", e instanceof Error ? e.message : e);
  process.exit(1);
});
