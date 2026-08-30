import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ffpath from "ffmpeg-static";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DEALS } = require("./deals.cjs") as {
  DEALS: { slug: string; name: string; scenes: { narration: string; visual: unknown }[] }[];
};

const FF = ffpath as unknown as string;
const FPS = 30;

function frames(file: string): number {
  let stderr = "";
  try {
    execFileSync(FF, ["-i", file], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e: unknown) {
    stderr = String((e as { stderr?: Buffer }).stderr || "");
  }
  const m = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(stderr);
  if (!m) throw new Error("нет длительности: " + file);
  const sec = +m[1] * 3600 + +m[2] * 60 + +m[3];
  return Math.ceil(sec * FPS) + 6;
}

(async () => {
  console.log("Бандл...");
  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts") });

  // Опциональный фильтр: `npx tsx remotion/render-deals.ts finsight` — рендерит только один slug
  const only = process.argv[2];
  const deals = only ? DEALS.filter((d) => d.slug === only) : DEALS;
  if (only && deals.length === 0) throw new Error("нет сделки со slug: " + only);

  for (const d of deals) {
    const scenes = d.scenes.map((s, i) => ({
      durationInFrames: frames(`public/uploads/v2/audio/${d.slug}-a${i}.mp3`),
      audio: `uploads/v2/audio/${d.slug}-a${i}.mp3`,
      visual: s.visual,
    }));
    const total = scenes.reduce((x, s) => x + s.durationInFrames, 0);
    const out = path.resolve(`public/uploads/${d.slug}-video.mp4`);
    console.log(`\n${d.name}: ${scenes.length} сцен, ~${Math.round(total / FPS)} сек → ${d.slug}-video.mp4`);

    const composition = await selectComposition({ serveUrl, id: "CompanyVideo", inputProps: { scenes } });
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: out,
      inputProps: { scenes },
      concurrency: 2,
      // Максимальное качество: 1920×1080, низкий CRF, медленный пресет
      crf: 16,
      x264Preset: "slow",
    });
    console.log(`✅ готово: ${d.slug}-video.mp4`);
  }
  console.log("\nВсе видео отрендерены.");
  process.exit(0);
})().catch((e) => {
  console.error("ОШИБКА:", e instanceof Error ? e.message : e);
  process.exit(1);
});
