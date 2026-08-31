// Озвучка сцен через edge-tts (ru-RU-DmitryNeural), бесплатно, без ключей.
// Генерит только НЕДОСТАЮЩИЕ mp3 (существующие HeyGen-озвучки не трогает).
// Результат: public/uploads/v2/audio/{slug}-a{i}.mp3
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("node:child_process");
const { DEALS } = require("./deals.cjs");

const VOICE = process.env.EDGE_TTS_VOICE || "ru-RU-DmitryNeural";
const OUTDIR = path.resolve(__dirname, "..", "public", "uploads", "v2", "audio");
fs.mkdirSync(OUTDIR, { recursive: true });

// Фильтр по slug: `node gen-deal-audio-edge.cjs academy` → только slug, начинающиеся с "academy"
const filter = process.argv[2];

let made = 0, skipped = 0, failed = 0;
for (const d of DEALS) {
  if (filter && !d.slug.startsWith(filter)) continue;
  for (let i = 0; i < d.scenes.length; i++) {
    const out = path.join(OUTDIR, `${d.slug}-a${i}.mp3`);
    if (fs.existsSync(out)) { skipped++; continue; }
    const text = d.scenes[i].narration;
    try {
      execFileSync("py", ["-m", "edge_tts", "--voice", VOICE, "--rate", "-4%", "--text", text, "--write-media", out], { stdio: "ignore" });
      if (fs.existsSync(out) && fs.statSync(out).size > 1000) { made++; console.log("✅", `${d.slug}-a${i}`); }
      else { failed++; console.log("✗ пусто:", `${d.slug}-a${i}`); }
    } catch (e) {
      failed++; console.log("✗ ошибка:", `${d.slug}-a${i}`, String(e.message).slice(0, 120));
    }
  }
}
console.log(`\nИТОГО: создано ${made}, пропущено ${skipped}, ошибок ${failed}`);
process.exit(failed > 0 ? 1 : 0);
