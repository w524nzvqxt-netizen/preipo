"use client";

// Hero «private deal terminal»: full-bleed тёмная сцена, приглушённый 3D-фон,
// строгий заголовок и интерфейс доступа к сделкам (DealTerminal) справа.
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { DataCanvas } from "@/components/motion/DataCanvas";
import { Candlesticks } from "@/components/motion/Candlesticks";
import { SolarSystem, type Planet } from "@/components/motion/SolarSystem";
import { DealTerminal, type TerminalDeal } from "@/components/DealTerminal";

export function Hero({
  planets = [],
  deals = [],
}: {
  planets?: Planet[];
  deals?: TerminalDeal[];
}) {
  // Параллакс от курсора — слойный: звёзды смещаются слабо, свет-орб — сильно
  // и навстречу курсору, поэтому глубина читается.
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 80, damping: 18, mass: 0.3 });
  const py = useSpring(my, { stiffness: 80, damping: 18, mass: 0.3 });
  const farX = useTransform(px, (v) => v * 30);
  const farY = useTransform(py, (v) => v * 30);
  function onMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <section
      onMouseMove={onMove}
      className="full-bleed grain relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-bg"
    >
      {/* Дальний слой — звёздное небо + свечи (мягкий параллакс) */}
      <motion.div style={{ x: farX, y: farY, scale: 1.08 }} className="pointer-events-none absolute inset-0">
        <DataCanvas className="absolute inset-0 opacity-60" />
        <div className="grid-overlay absolute inset-0" />
        {/* Японские свечи — крупная живая лента снизу */}
        <div className="absolute inset-x-0 bottom-0 h-[60%]">
          <Candlesticks className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-bg/80" />
        </div>
        <div className="scene-vignette absolute inset-0" />
      </motion.div>
      {/* Солнечная система компаний: жёлтое солнце + планеты по капитализации */}
      <SolarSystem planets={planets} className="pointer-events-none absolute inset-0 z-0 opacity-25 sm:opacity-40" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-12">
        {/* Левая колонка */}
        <div className="lg:col-span-7">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="kicker kicker-gold inline-block"
          >
            Pre-IPO · для квалифицированных инвесторов
          </motion.span>

          <SplitReveal
            text="Доступ к сделкам Pre-IPO для квалифицированных инвесторов"
            highlight={["Pre-IPO"]}
            delay={0.15}
            className="mt-5 text-[clamp(34px,5vw,64px)] font-extrabold leading-[1.05] tracking-tight text-text-primary [text-shadow:0_2px_30px_rgba(0,0,0,0.8)]"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
          >
            SpaceX, OpenAI, Anthropic, Databricks и другие частные компании до выхода
            на биржу. Подбираем сделки, показываем структуру входа, риски, сроки и
            сценарии выхода.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <MagneticButton
              href="#deals"
              className="rounded-control bg-brand px-7 py-3.5 text-center font-semibold text-bg ring-1 ring-inset ring-white/10 transition-all duration-300 hover:brightness-105"
            >
              Получить список сделок
            </MagneticButton>
            <a
              href="#quiz"
              className="rounded-control border border-border bg-surface/30 px-7 py-3.5 text-center font-semibold text-text-primary backdrop-blur-sm transition-all duration-300 hover:border-border-strong hover:bg-surface"
            >
              Узнать, подхожу ли я как инвестор
            </a>
          </motion.div>

          {/* Строка доверия */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-6 max-w-xl text-sm leading-relaxed text-text-muted"
          >
            Только для квалифицированных инвесторов. Сделки сопровождаются документами,
            раскрытием рисков и индивидуальной консультацией.
          </motion.p>
        </div>

        {/* Правая колонка — private deal terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:col-span-5"
        >
          <DealTerminal deals={deals} />
        </motion.div>
      </div>

      {/* scroll-cue — тонкая «мышь» со скользящей точкой */}
      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-border-strong/70 p-1.5">
          <motion.span
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-brand"
          />
        </div>
      </div>
    </section>
  );
}
