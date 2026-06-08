import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ffpath from "ffmpeg-static";

const FF = ffpath as unknown as string;
const FPS = 30;
const TMP = "/Users/pirskiyka/Desktop/pre ipo/.short_tmp.mp4";
const OUT = "/Users/pirskiyka/Desktop/pre ipo/Short_01.mp4";

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
  return Math.ceil(sec * FPS) + 5;
}

// Short #1 — подробный, 9 сегментов, ~1 минута. Уникальный клип на каждый.
const SEGS = [
  { c: "s1c0", a: "s1a0", caption: "Купить акции ДО биржи?", hook: true },
  { c: "s1c1", a: "s1a1", caption: "Это — pre-IPO" },
  { c: "s1c4", a: "s1a2", caption: "Путь компании: стартап → IPO" },
  { c: "s1c5", a: "s1a3", caption: "Pre-IPO — предпоследний шаг" },
  { c: "s1c6", a: "s1a4", caption: "OpenAI, Anthropic ≈ $1 трлн" },
  { c: "s1c7", a: "s1a5", caption: "Раньше — только фондам" },
  { c: "s1c2", a: "s1a6", caption: "Войти раньше. Заработать на росте." },
  { c: "s1c3", a: "s1a7", caption: "Но риск всегда рядом" },
  { c: "s1c8", a: "s1a8", caption: "Инвестируй осознанно" },
];

(async () => {
  const scenes = SEGS.map((s) => ({
    durationInFrames: frames(`public/uploads/v2/shorts/${s.a}.mp3`),
    audio: `uploads/v2/shorts/${s.a}.mp3`,
    clip: `uploads/v2/shorts/${s.c}.mp4`,
    caption: s.caption,
    hook: (s as any).hook ?? false,
  }));
  const total = scenes.reduce((a, s) => a + s.durationInFrames, 0);
  console.log("Сцен:", scenes.length, "| ~", Math.round(total / FPS), "сек");

  const serveUrl = await bundle({ entryPoint: path.resolve("remotion/index.ts") });
  const composition = await selectComposition({ serveUrl, id: "Short", inputProps: { scenes } });
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: TMP, inputProps: { scenes }, concurrency: 2 });

  // faststart для надёжной загрузки в Instagram/соцсети
  execFileSync(FF, ["-y", "-i", TMP, "-c", "copy", "-movflags", "+faststart", OUT]);
  execFileSync("rm", ["-f", TMP]);
  console.log("Готово:", OUT);
  process.exit(0);
})().catch((e) => {
  console.error("ОШИБКА:", e instanceof Error ? e.message : e);
  process.exit(1);
});
