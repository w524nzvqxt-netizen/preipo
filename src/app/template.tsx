"use client";

// Содержимое видно уже в серверном HTML, без ожидания анимации и гидратации.
// Обёртка не использует transform, чтобы сохранить position:fixed/sticky.
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  // Админка и кабинет агента — рабочий инструмент с частой навигацией между
  // страницами: шторка на каждый переход там только мешает, отключаем её.
  const cinematic = !pathname.startsWith("/admin") && !pathname.startsWith("/agent");
  if (reduce || !cinematic) return <>{children}</>;
  return (
    <>
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
