"use client";

// Тонкая полоса прогресса скролла сверху страницы (премиум-деталь).
// Работает поверх Lenis (он двигает реальный скролл окна).
import { usePathname } from "next/navigation";
import { motion, useScroll } from "motion/react";

export function ScrollProgress() {
  // Без пружины: полоса привязана прямо к прогрессу скролла (Lenis и так плавный),
  // на одну непрерывную rAF-петлю меньше — меньше рывков.
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();
  // В админке/кабинете агента эта деталь неуместна и не нужна.
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;
  return (
    <motion.div
      style={{ scaleX: scrollYProgress, willChange: "transform" }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand to-accent"
    />
  );
}
