"use client";

// Кастомный курсор-кольцо: тянется за мышью с инерцией, увеличивается над
// интерактивными элементами. Нативный курсор остаётся (доступность). Только
// десктоп (на тач-устройствах не рендерится).
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
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
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
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
