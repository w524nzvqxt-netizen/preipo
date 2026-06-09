"use client";

// Переход при смене маршрута: тёмная штора уходит вверх (как у агентств) +
// мягкое появление контента. Штора цвета фона — плавно, без резкого флеша.
// template.tsx перемонтируется на каждую навигацию. Обёртка контента — только
// opacity (трансформ сломал бы position:fixed/sticky). Уважает reduced-motion.
import { motion, useReducedMotion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <>
      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        style={{ originY: 0 }}
        className="pointer-events-none fixed inset-0 z-[90] bg-bg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
