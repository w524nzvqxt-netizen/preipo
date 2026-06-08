// Генерация озвучки HeyGen (голос Dmitry) по сценам сделок → извлечение аудио в mp3.
// Результат: public/uploads/v2/audio/{slug}-a{i}.mp3
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("node:child_process");
const FF = require("ffmpeg-static");
const { DEALS } = require("./deals.cjs");

const API = "https://api.heygen.com";
const KEY = process.env.HEYGEN_API_KEY;
const AVATAR = process.env.HEYGEN_AVATAR_ID || "Aditya_public_4";
const VOICE = process.env.HEYGEN_VOICE_ID || "5f99970adadb42398bf1aeb963a3888b";
const OUTDIR = path.resolve(__dirname, "..", "public", "uploads", "v2", "audio");
fs.mkdirSync(OUTDIR, { recursive: true });
const TMP = path.resolve(__dirname, "..", ".video-tmp");
fs.mkdirSync(TMP, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submit(text) {
  const res = await fetch(`${API}/v2/video/generate`, {
    method: "POST", headers: { "X-Api-Key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ video_inputs: [{ character: { type: "avatar", avatar_id: AVATAR, avatar_style: "normal" }, voice: { type: "text", input_text: text, voice_id: VOICE } }], dimension: { width: 1280, height: 720 } }),
  });
  const j = await res.json();
  if (!j.data?.video_id) throw new Error("submit: " + JSON.stringify(j).slice(0, 200));
  return j.data.video_id;
}
async function status(id) {
  const res = await fetch(`${API}/v1/video_status.get?video_id=${id}`, { headers: { "X-Api-Key": KEY } });
  const j = await res.json(); const d = j.data ?? {};
  return { status: d.status, url: d.video_url };
}
async function download(url, file) {
  const res = await fetch(url); const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
}

(async () => {
  // 1) submit all
  const jobs = [];
  for (const d of DEALS) {
    for (let i = 0; i < d.scenes.length; i++) {
      const out = path.join(OUTDIR, `${d.slug}-a${i}.mp3`);
      if (fs.existsSync(out)) { console.log("skip (есть):", `${d.slug}-a${i}`); continue; }
      const id = await submit(d.scenes[i].narration);
      jobs.push({ slug: d.slug, i, id, out });
      console.log("submit", `${d.slug}-a${i}`, id);
      await sleep(1500);
    }
  }
  // 2) poll + download + extract
  const deadline = Date.now() + 25 * 60 * 1000;
  while (jobs.some((j) => !j.done) && Date.now() < deadline) {
    for (const j of jobs) {
      if (j.done) continue;
      const s = await status(j.id);
      if (s.status === "completed" && s.url) {
        const mp4 = path.join(TMP, `${j.slug}-a${j.i}.mp4`);
        await download(s.url, mp4);
        execFileSync(FF, ["-y", "-i", mp4, "-vn", "-acodec", "libmp3lame", "-q:a", "4", j.out], { stdio: "ignore" });
        fs.rmSync(mp4, { force: true });
        j.done = true;
        console.log("✅ готово:", `${j.slug}-a${j.i}`);
      } else if (s.status === "failed") {
        j.done = true; console.log("✗ failed:", `${j.slug}-a${j.i}`);
      }
      await sleep(800);
    }
    if (jobs.some((j) => !j.done)) { console.log("ждём...", jobs.filter((j) => !j.done).length, "осталось"); await sleep(8000); }
  }
  const ok = jobs.filter((j) => j.done && fs.existsSync(j.out)).length;
  console.log(`\nИТОГО озвучек готово: ${ok}/${jobs.length}`);
  process.exit(0);
})().catch((e) => { console.error("ОШИБКА:", e.message); process.exit(1); });
