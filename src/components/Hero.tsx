"use client";

// Премиальный анимированный hero: слоган о pre-IPO, анимация текста по словам,
// сменяющиеся слова, видео и счётчики.
import { motion, useInView, useMotionValue, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
import { AnimatedWords } from "@/components/motion/AnimatedWords";
import { RotatingText } from "@/components/motion/RotatingText";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({
  projectCount,
  totalVolume,
  hotCount,
}: {
  projectCount: number;
  totalVolume: number;
  hotCount: number;
}) {
  return (
    <section className="relative mt-8 grid items-center gap-10 sm:mt-14 lg:grid-cols-2">
      <div>
        {/* Бейдж */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Pre-IPO · инвестиции до биржи
        </motion.div>

        {/* Заголовок-слоган с анимацией по словам */}
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          <AnimatedWords
            text="Будущие гиганты — пока ещё частные"
            delay={0.2}
            highlight={["гиганты"]}
          />
        </h1>

        {/* Слоган со сменяющимися словами */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-4 text-2xl font-bold sm:text-3xl"
        >
          Войдите{" "}
          <RotatingText
            words={["до IPO", "до биржи", "раньше всех", "до роста"]}
          />
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease }}
          className="mt-5 max-w-xl text-base text-neutral-600 sm:text-lg"
        >
          Pre-IPO открывает доступ к долям в зрелых частных компаниях до их
          выхода на биржу. Выбирайте проекты и оставляйте заявку — поможем войти
          в сделку.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1, ease }}
          className="mt-7 flex flex-col gap-3 sm:flex-row"
        >
          <a
            href="#projects"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/40"
          >
            Смотреть проекты
          </a>
          <a
            href="#about"
            className="rounded-xl border border-neutral-300 bg-white/60 px-6 py-3 text-center font-semibold backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white"
          >
            Как это работает
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.15 }}
          className="mt-9 flex flex-wrap gap-x-8 gap-y-5"
        >
          <Counter value={projectCount} label="проектов в витрине" />
          <Counter value={totalVolume} label="суммарный объём" kind="money" />
          <Counter value={hotCount} label="горячих сделок" />
        </motion.div>
      </div>

      {/* Видео */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease }}
        className="relative order-first lg:order-none"
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="glow overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-emerald-50 to-neutral-100"
        >
          <video
            className="aspect-video w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/uploads/prometheus.jpg"
          >
            <source src="/uploads/hero.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Счётчик с анимацией набора числа
function Counter({
  value,
  label,
  kind = "plain",
}: {
  value: number;
  label: string;
  kind?: "plain" | "money";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplay(kind === "money" ? formatMoney(v) : String(Math.round(v)));
      },
    });
    return () => controls.stop();
  }, [inView, value, kind, mv]);

  return (
    <div ref={ref}>
      <div className="text-3xl font-bold text-emerald-600">{display}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}
