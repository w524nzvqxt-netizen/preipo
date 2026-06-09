"use client";

// Плавный переход при смене маршрута (мягкое появление). template.tsx
// перемонтируется на каждую навигацию — этого достаточно для transition.
// Анимируем только opacity: трансформ на обёртке сломал бы position:fixed/sticky
// (липкая шапка, мобильный CTA). Уважаем prefers-reduced-motion.
import { motion, useReducedMotion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
