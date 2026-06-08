"use client";

// Премиальный тёмный кинематографичный hero: свечение, плавающие орбы,
// GSAP-параллакс, анимация текста, видео и счётчики.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
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
  const root = useRef<HTMLDivElement>(null);

  // GSAP-параллакс орбов при скролле
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(".orb-a", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".orb-b", {
        yPercent: -25,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#070710] px-6 py-12 text-white sm:px-10 sm:py-16"
    >
      {/* Свечение / орбы */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="orb-a absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div className="orb-b absolute right-[-10%] top-[10%] h-[460px] w-[460px] rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[30%] h-[420px] w-[420px] rounded-full bg-teal-400/15 blur-[120px]" />
        {/* мягкая сетка */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300 backdrop-blur"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.8)]" />
            Pre-IPO · инвестиции до биржи
          </motion.div>

          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            <AnimatedWords
              text="Будущие гиганты — пока ещё частные"
              delay={0.2}
              highlight={["гиганты"]}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-4 text-2xl font-bold sm:text-3xl"
          >
            Войдите{" "}
            <RotatingText words={["до IPO", "до биржи", "раньше всех", "до роста"]} />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85, ease }}
            className="mt-5 max-w-xl text-base text-neutral-300 sm:text-lg"
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
              className="rounded-xl bg-emerald-500 px-6 py-3 text-center font-semibold text-neutral-950 shadow-[0_0_40px_-8px_rgba(52,211,153,0.7)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              Смотреть проекты
            </a>
            <a
              href="#about"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-center font-semibold backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/10"
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
            className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_90px_-30px_rgba(16,185,129,0.55)]"
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
      </div>
    </div>
  );
}

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
      <div className="text-3xl font-bold text-emerald-400">{display}</div>
      <div className="text-sm text-neutral-400">{label}</div>
    </div>
  );
}
