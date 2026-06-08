"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "motion/react";
import { formatMoney } from "@/lib/format";

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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mt-6 bg-surface border border-border rounded-card px-6 py-12 sm:px-10 sm:py-14"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Левая колонка */}
        <div>
          <span className="kicker">Pre-IPO · инвестиции до биржи</span>

          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
            Будущие гиганты — пока ещё{" "}
            <span className="text-brand">частные</span>
          </h1>

          <p className="mt-5 max-w-[60ch] text-base text-text-secondary sm:text-lg">
            Pre-IPO открывает доступ к долям в зрелых частных компаниях до их
            выхода на биржу. Выбирайте проекты и оставляйте заявку — поможем
            войти в сделку.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#projects"
              className="rounded-control bg-brand px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Смотреть проекты
            </a>
            <a
              href="#about"
              className="rounded-control border border-border px-6 py-3 text-center font-semibold text-text-primary transition-colors hover:bg-surface-alt"
            >
              Как это работает
            </a>
          </div>

          {/* KPI-стрип */}
          <div className="mt-9 grid grid-cols-3 divide-x divide-border rounded-control bg-surface-alt px-5 py-4">
            <KpiCell value={projectCount} label="проектов" />
            <KpiCell value={totalVolume} label="суммарный объём" kind="money" />
            <KpiCell value={hotCount} label="горячих сделок" />
          </div>
        </div>

        {/* Правая колонка — видео */}
        <div className="order-first lg:order-none overflow-hidden rounded-card border border-border">
          <video
            className="aspect-video w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/uploads/poster-hero.jpg"
          >
            <source src="/uploads/hero.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCell({
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
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplay(kind === "money" ? formatMoney(v) : String(Math.round(v)));
      },
    });
    return () => controls.stop();
  }, [inView, value, kind, mv]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
      <span className="nums text-2xl font-bold text-text-primary">{display}</span>
      <span className="kicker">{label}</span>
    </div>
  );
}
