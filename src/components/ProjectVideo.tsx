"use client";

// Видео о проекте: сцены сценария (титры + опц. закадровая озвучка) поверх
// кинематографичных фонов Higgsfield. Без человека в кадре.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export type VideoScene = { caption: string; narration: string };

const BG_VIDEOS = [
  "/uploads/hero.mp4",
  "/uploads/scene-growth.mp4",
  "/uploads/scene-exchange.mp4",
];
const SCENE_SEC = 7;

export function ProjectVideo({
  scenes,
  title,
}: {
  scenes: VideoScene[];
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 0.97;
    const v = synth
      .getVoices()
      .find((x) => x.lang?.toLowerCase().startsWith("ru"));
    if (v) u.voice = v;
    synth.speak(u);
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (voiceOn) speak(scenes[index].narration);
    timerRef.current = setTimeout(() => {
      if (index + 1 < scenes.length) setIndex((i) => i + 1);
      else stop();
    }, SCENE_SEC * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, voiceOn, scenes, speak, stop]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!scenes.length) return null;
  const bg = playing ? index % BG_VIDEOS.length : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 shadow-sm">
      <div className="relative aspect-video w-full bg-neutral-900">
        {BG_VIDEOS.map((src, i) => (
          <video
            key={src}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              bg === i ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={src} type="video/mp4" />
          </video>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.p
            key={playing ? index : "idle"}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl text-lg font-semibold text-white drop-shadow sm:text-2xl"
          >
            {playing ? scenes[index].caption : `Видео о проекте: ${title}`}
          </motion.p>
        </AnimatePresence>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={playing ? stop : () => { setIndex(0); setPlaying(true); }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105"
            aria-label={playing ? "Стоп" : "Смотреть"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <div className="flex flex-1 gap-1">
            {scenes.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  playing && i <= index ? "bg-emerald-400" : "bg-white/40"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => {
              if (voiceOn) window.speechSynthesis?.cancel();
              setVoiceOn((v) => !v);
            }}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              voiceOn ? "bg-emerald-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {voiceOn ? "🔊 Озвучка вкл" : "🔇 Озвучка"}
          </button>
        </div>
      </div>
    </div>
  );
}
