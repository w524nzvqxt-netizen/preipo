import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import ffpath from "ffmpeg-static";

const FF = ffpath as unknown as string;
const FPS = 30;
const TMP = path.resolve(".video-tmp/exp-full.mp4");
const OUT = path.resolve("public/uploads/main-pre-ipo.mp4");

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
  return Math.ceil(sec * FPS) + 6;
}

// 12 сегментов, по уникальному горизонтальному клипу на каждый
const SEG = [
  { clip: "uploads/hero.mp4", title: "Что такое pre-IPO?", sub: "Чётко и понятно" },
  { clip: "uploads/scene-exchange.mp4", caption: "Акции ДО биржи" },
  { clip: "uploads/scene-growth.mp4", caption: "Стадии: Seed → Series A, B, C" },
  { clip: "uploads/v2/clip-finance.mp4", caption: "Финал — IPO на бирже" },
  { clip: "uploads/v2/clip-datacenter.mp4", caption: "Зрелая частная компания" },
  { clip: "uploads/v2/clip-ailab.mp4", caption: "OpenAI, Anthropic ≈ $1 трлн" },
  { clip: "uploads/v2/clip-industrial.mp4", caption: "Раньше — только фондам" },
  { clip: "uploads/v2/clip-cad.mp4", caption: "Войти по оценке раунда" },
  { clip: "uploads/v2/clip-aero.mp4", caption: "Facebook, Uber: рост в десятки раз" },
  { clip: "uploads/v2/clip-chip.mp4", caption: "WeWork: $47B → почти ноль" },
  { clip: "uploads/v2/clip-simulation.mp4", caption: "Горизонт: 3–7 лет" },
  { clip: "uploads/v2/clip-manufacturing.mp4", caption: "Инвестируй осознанно" },
];

(async () => {
  const scenes = SEG.map((s, i) => ({
    durationInFrames: frames(`public/uploads/v2/expaudio/e${i}.mp3`),
    audio: `uploads/v2/expaudio/e${i}.mp3`,
    visual: { type: "video", src: s.clip, title: (s as any).title, subtitle: (s as any).sub, caption: (s as any).caption },
  }));
  const total = scenes.reduce((a, s) => a + s.durationInFrames, 0);
  console.log("Сцен:", scenes.length, "| ~", Math.round(total / FPS), "сек");

  mkdirSync(path.dirname(TMP), { recursive: true });

  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts") });
  const composition = await selectComposition({ serveUrl, id: "CompanyVideo", inputProps: { scenes } });

  // Супер-сэмплинг ×1.5 (→ 2880×1620): резкая графика/текст; crf 15 ≈ без потерь
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 15,
    scale: 1.5,
    outputLocation: TMP,
    inputProps: { scenes },
    concurrency: null,
  });

  // Только ремукс под веб (faststart) — БЕЗ повторного сжатия, качество сохраняется
  execFileSync(FF, ["-y", "-i", TMP, "-c", "copy", "-movflags", "+faststart", OUT]);
  rmSync(TMP, { force: true });
  console.log("Готово (главная, 1080p):", OUT);
  process.exit(0);
})().catch((e) => {
  console.error("ОШИБКА:", e instanceof Error ? e.message : e);
  process.exit(1);
});
