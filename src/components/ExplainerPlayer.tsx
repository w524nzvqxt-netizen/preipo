"use client";

// Видео-объяснение про pre-IPO: кинематографичный фон + титры (по таймеру) +
// шкала этапов развития компании рядом. Озвучка — опционально (тумблер).
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Scene = {
  caption: string;
  narration: string;
  sec: number;
  stage: number;
  bg: number; // индекс фонового видео
};

// Фоновые видео (кроссфейд между сценами)
const BG_VIDEOS = [
  "/uploads/hero.mp4",
  "/uploads/scene-growth.mp4",
  "/uploads/scene-exchange.mp4",
];

// Сценарий (см. docs/VIDEO_SCRIPT.md). stage — какой этап подсвечивать.
const SCENES: Scene[] = [
  {
    caption: "Pre-IPO — инвестиции до выхода на биржу",
    narration:
      "Что если бы вы могли вложиться в компанию ещё до того, как её акции появятся на бирже? Именно это и есть pre-IPO.",
    sec: 7,
    stage: 3,
    bg: 0,
  },
  {
    caption: "Путь компании: от стартапа до биржи",
    narration:
      "Любая компания проходит путь: стартап, венчурные раунды, и в конце — выход на биржу. Pre-IPO — это предпоследний шаг.",
    sec: 8,
    stage: 0,
    bg: 0,
  },
  {
    caption: "Вы входите за несколько лет до IPO",
    narration:
      "Вы покупаете долю в зрелой частной компании по цене закрытого раунда — за несколько лет до её листинга.",
    sec: 8,
    stage: 3,
    bg: 0,
  },
  {
    caption: "Цель — кратный рост к моменту exit",
    narration:
      "Идея проста: войти по оценке частного раунда и зафиксировать прибыль, когда компания выйдет на биржу или будет продана — нередко в разы дороже.",
    sec: 9,
    stage: 4,
    bg: 1,
  },
  {
    caption: "Успехи: ранний вход в будущих лидеров",
    narration:
      "Ранние инвесторы Facebook, Uber или Coinbase заходили задолго до IPO — и их вложения выросли в десятки раз.",
    sec: 8,
    stage: 4,
    bg: 1,
  },
  {
    caption: "Риски: неликвидность · нет гарантии IPO · потеря капитала",
    narration:
      "Но это не гарантия. WeWork рухнул перед самым IPO. Деньги в частных компаниях неликвидны, IPO может не состояться, а капитал — потеряться полностью.",
    sec: 9,
    stage: 3,
    bg: 0,
  },
  {
    caption: "Горизонт: 3–7 лет. Терпеливый капитал",
    narration:
      "Pre-IPO — это игра вдолгую. Горизонт обычно от трёх до семи лет. Это инвестиция терпеливого капитала, а не быстрая спекуляция.",
    sec: 8,
    stage: 3,
    bg: 0,
  },
  {
    caption: "Изучайте проекты и инвестируйте осознанно",
    narration:
      "Изучайте проекты, оценивайте риски и инвестируйте осознанно. Актуальные pre-IPO сделки — на нашей витрине.",
    sec: 7,
    stage: 4,
    bg: 2,
  },
];

// Этапы развития компании
const STAGES = [
  { title: "Стартап", sub: "идея, первый продукт" },
  { title: "Seed / Angel", sub: "первые инвестиции" },
  { title: "Series A–C", sub: "масштабирование" },
  { title: "Pre-IPO", sub: "вы здесь — вход до биржи" },
  { title: "IPO", sub: "выход на биржу" },
];

export function ExplainerPlayer() {
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
    const voices = synth.getVoices();
    // Предпочитаем более качественные русские голоса
    const preferred =
      voices.find((v) => /milena|yuri|google/i.test(v.name) && /ru/i.test(v.lang)) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("ru"));
    if (preferred) u.voice = preferred;
    synth.speak(u);
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  // Прогресс по таймеру (работает и без звука)
  useEffect(() => {
    if (!playing) return;
    const scene = SCENES[index];
    if (voiceOn) speak(scene.narration);
    timerRef.current = setTimeout(() => {
      if (index + 1 < SCENES.length) setIndex((i) => i + 1);
      else stop();
    }, scene.sec * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, voiceOn, speak, stop]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function play() {
    setIndex(0);
    setPlaying(true);
  }

  const activeStage = playing ? SCENES[index].stage : 3;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Видео + титры */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 shadow-sm lg:col-span-2">
        <div className="relative aspect-video w-full bg-neutral-900">
          {BG_VIDEOS.map((src, i) => (
            <video
              key={src}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                (playing ? SCENES[index].bg : 0) === i
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              autoPlay
              muted
              loop
              playsInline
              poster="/uploads/prometheus.jpg"
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
              {playing ? SCENES[index].caption : "Что такое pre-IPO — за 1 минуту"}
            </motion.p>
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={playing ? stop : play}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105"
              aria-label={playing ? "Стоп" : "Смотреть"}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <div className="flex flex-1 gap-1">
              {SCENES.map((_, i) => (
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
                voiceOn
                  ? "bg-emerald-500 text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title="Закадровая озвучка (синтез речи)"
            >
              {voiceOn ? "🔊 Озвучка вкл" : "🔇 Озвучка"}
            </button>
          </div>
        </div>
      </div>

      {/* Шкала этапов развития компании */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Этапы развития компании
        </h3>
        <ol className="mt-4 space-y-1">
          {STAGES.map((s, i) => {
            const active = i === activeStage;
            const isPreIpo = i === 3;
            return (
              <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
                {/* линия */}
                {i < STAGES.length - 1 && (
                  <span className="absolute left-[11px] top-6 h-full w-px bg-neutral-200" />
                )}
                <span
                  className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                    active
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isPreIpo
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-neutral-300 bg-white text-neutral-400"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <div
                    className={`font-semibold leading-tight ${
                      isPreIpo ? "text-emerald-700" : "text-neutral-900"
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-xs text-neutral-500">{s.sub}</div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Pre-IPO — вход в зрелую частную компанию до её выхода на биржу.
        </p>
      </div>
    </div>
  );
}
