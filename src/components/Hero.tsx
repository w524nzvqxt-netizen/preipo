"use client";

// Премиум-hero «Обсерватория капитала»: full-bleed тёмная сцена с генеративным
// созвездием, кинетическим заголовком и стеклянным KPI-виджетом.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, useReducedMotion, animate } from "motion/react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { DataCanvas } from "@/components/motion/DataCanvas";
import { Candlesticks } from "@/components/motion/Candlesticks";
import { SolarSystem, type Planet } from "@/components/motion/SolarSystem";

export function Hero({
  dealCount,
  closedCount,
  avgReturn,
  planets = [],
}: {
  dealCount: number;
  closedCount: number;
  avgReturn: number;
  planets?: Planet[];
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
      <SolarSystem planets={planets} className="pointer-events-none absolute inset-0 z-0 opacity-60 sm:opacity-100" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-12">
        {/* Левая колонка */}
        <div className="lg:col-span-7">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="kicker kicker-gold inline-block"
          >
            Pre-IPO · доступ до биржи
          </motion.span>

          <SplitReveal
            text="Инвестируйте в гигантов до IPO"
            highlight={["IPO"]}
            delay={0.15}
            className="mt-5 text-[clamp(36px,8vw,104px)] font-extrabold leading-[1.0] text-text-primary [text-shadow:0_2px_40px_rgba(0,0,0,0.85)]"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
          >
            Pre-IPO открывает доступ к долям в зрелых частных компаниях до их выхода
            на биржу. Отобранные сделки, аналитика и сценарии — войдите раньше всех.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <MagneticButton
              href="#projects"
              className="glow-brand rounded-control bg-brand px-7 py-3.5 text-center font-semibold text-bg transition-colors hover:brightness-110"
            >
              Смотреть проекты
            </MagneticButton>
            <a
              href="#about"
              className="hairline rounded-control px-7 py-3.5 text-center font-semibold text-text-primary transition-colors hover:bg-surface"
            >
              Как это работает
            </a>
          </motion.div>
        </div>

        {/* Правая колонка — стеклянный KPI-виджет */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:col-span-5"
        >
          <div className="glass inset-panel rounded-card p-1">
            <div className="rounded-[14px] p-6">
              <div className="flex items-center justify-between">
                <span className="kicker text-text-muted">Витрина · live</span>
                <span className="glow-pulse h-2 w-2 rounded-full bg-brand" />
              </div>
              <div className="mt-6 grid grid-cols-3 divide-x divide-border">
                <Kpi value={dealCount} label="сделок" />
                <Kpi value={closedCount} label="реализовано" />
                <Kpi value={avgReturn} label="ср. дох., %/год" accent />
              </div>
              <div className="mt-6 hairline rounded-control p-4">
                <p className="kicker text-text-muted">Под наблюдением</p>
                <p className="nums mt-1 text-2xl font-bold text-brand">
                  20+ компаний от раунда до IPO
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* scroll-cue */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-text-muted"
      >
        ↓
      </motion.div>
    </section>
  );
}

function Kpi({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [d, setD] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setD(String(Math.round(v))),
    });
    return () => c.stop();
  }, [inView, value, mv]);
  return (
    <div ref={ref} className="px-3 first:pl-0 last:pr-0">
      <div className={`nums text-3xl font-bold ${accent ? "text-brand" : "text-text-primary"}`}>
        {d}
      </div>
      <div className="kicker mt-1 text-text-muted">{label}</div>
    </div>
  );
}
