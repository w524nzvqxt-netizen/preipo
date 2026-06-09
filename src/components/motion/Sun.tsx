"use client";

// «Солнце» в hero: корона + яркое ядро. Реагирует на курсор (параллакс +
// разгорается при движении мыши) и опускается вниз при прокрутке (закат).
// Уважает prefers-reduced-motion (статичное, без реакций).
import { useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

export function Sun() {
  const reduce = useReducedMotion();

  // Закат: опускается вниз по мере прокрутки первого экрана
  const { scrollY } = useScroll();
  const descend = useTransform(scrollY, [0, 900], [0, 460]);
  const y = useSpring(descend, { stiffness: 80, damping: 26 });

  // Курсор: параллакс + яркость
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const glow = useMotionValue(0.5);
  const px = useSpring(mx, { stiffness: 70, damping: 18 });
  const py = useSpring(my, { stiffness: 70, damping: 18 });
  const sglow = useSpring(glow, { stiffness: 50, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    let timer: ReturnType<typeof setTimeout>;
    function onMove(e: PointerEvent) {
      mx.set((e.clientX / window.innerWidth - 0.5) * 70);
      my.set((e.clientY / window.innerHeight - 0.5) * 45);
      glow.set(1); // разгорается при движении
      clearTimeout(timer);
      timer = setTimeout(() => glow.set(0.5), 220); // гаснет в покое
    }
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimeout(timer);
    };
  }, [reduce, mx, my, glow]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[12%] z-0 -ml-[260px]">
      <motion.div style={{ y: reduce ? 0 : y }}>
        <motion.div style={{ x: reduce ? 0 : px, y: reduce ? 0 : py }}>
          <motion.div
            style={{ opacity: reduce ? 0.6 : sglow }}
            className="relative h-[520px] w-[520px]"
          >
            {/* Корона */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,255,250,0.9) 0%, rgba(39,224,168,0.55) 18%, rgba(201,162,39,0.28) 42%, rgba(39,224,168,0) 70%)",
                filter: "blur(30px)",
              }}
            />
            {/* Ядро */}
            <div
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, #F4FFFA 0%, #27E0A8 55%, rgba(39,224,168,0) 78%)",
                filter: "blur(6px)",
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
