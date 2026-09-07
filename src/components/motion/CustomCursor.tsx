"use client";

// Кастомный курсор-кольцо: тянется за мышью с инерцией, увеличивается над
// интерактивными элементами. Нативный курсор остаётся (доступность). Только
// десктоп (на тач-устройствах не рендерится).
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue } from "motion/react";

// Кинематографичный курсор — только для публичной витрины. В админке/кабинете
// агента (обычный UI с таблицами и формами) он не нужен и не рендерится.
function isCinematicRoute(pathname: string): boolean {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/agent");
}

export function CustomCursor() {
  // Кольцо следует за мышью 1:1, без инерции — иначе оно «запаздывает».
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const cinematic = isCinematicRoute(pathname);

  useEffect(() => {
    if (!cinematic) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setEnabled(true);
    function move(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const t = e.target as HTMLElement | null;
      setActive(!!t?.closest("a,button,[role=button],input,textarea,label,select"));
    }
    function leave() {
      setVisible(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, [x, y, cinematic]);

  if (!cinematic || !enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x, y, willChange: "transform" }}
      className="pointer-events-none fixed left-0 top-0 z-[80]"
    >
      <motion.div
        animate={{ scale: active ? 2.6 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ marginLeft: -12, marginTop: -12, opacity: visible ? 1 : 0 }}
        className="h-6 w-6 rounded-full border border-brand transition-opacity duration-200"
      />
    </motion.div>
  );
}
