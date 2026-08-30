"use client";

// Перспективная сетка-«волна» как поверхность рынка: уходящая к горизонту плоскость
// колышется бегущими волнами, узлы на гребнях разгораются золотом. Единый rAF,
// пауза вне вьюпорта, DPR-кап, reduced-motion → статичный кадр.
import { useEffect, useRef } from "react";

export function MeshWave({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GOLD = "214,181,109"; // --color-brand
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let t = 0;

    // Сетка в «модельных» координатах: COLS по ширине, ROWS вглубь.
    // Проецируем в экран перспективой — дальние ряды сжаты к линии горизонта.
    const COLS = 26;
    const ROWS = 16;
    const HORIZON = 0.4; // доля высоты до линии горизонта (выше неё сетки нет)

    // Высота волны в точке (cx, cz): сумма двух бегущих синусов разной частоты.
    function wave(cx: number, cz: number): number {
      return (
        Math.sin(cx * 0.6 + cz * 0.5 - t * 1.1) * 0.5 +
        Math.sin(cx * 0.3 - cz * 0.7 - t * 0.7) * 0.5
      );
    }

    // Проекция узла сетки (i по ширине, j вглубь) в экранные координаты + сила гребня.
    function project(i: number, j: number) {
      const cx = (i / COLS - 0.5) * 2; // -1..1
      const cz = j / ROWS; // 0 (близко) .. 1 (горизонт)
      const persp = 1 / (1 + cz * 2.2); // дальние ряды ближе к центру/горизонту
      const lift = reduce ? 0 : wave(cx * 3, cz * 6) * 0.06 * (1 - cz * 0.4);
      const sx = w * 0.5 + cx * persp * w * 0.62;
      const baseY = h * (HORIZON + (1 - HORIZON) * (1 - persp) / (1 - 1 / (1 + 2.2)));
      const sy = baseY - lift * h;
      return { sx, sy, persp, crest: reduce ? 0 : (wave(cx * 3, cz * 6) + 1) / 2, cz };
    }

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // лёгкое золотое свечение у горизонта
      const hy = h * HORIZON;
      const glow = ctx!.createLinearGradient(0, hy - h * 0.12, 0, hy + h * 0.18);
      glow.addColorStop(0, `rgba(${GOLD},0)`);
      glow.addColorStop(0.5, `rgba(${GOLD},0.06)`);
      glow.addColorStop(1, `rgba(${GOLD},0)`);
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, hy - h * 0.12, w, h * 0.3);

      // предрасчёт узлов
      const pts = Array.from({ length: ROWS + 1 }, (_, j) =>
        Array.from({ length: COLS + 1 }, (_, i) => project(i, j))
      );

      // линии вглубь (по столбцам) и поперёк (по рядам) — тусклее с глубиной
      ctx!.lineWidth = 1;
      for (let j = 0; j <= ROWS; j++) {
        const fade = (1 - j / ROWS) * 0.5 + 0.06;
        ctx!.strokeStyle = `rgba(${GOLD},${0.12 * fade})`;
        ctx!.beginPath();
        for (let i = 0; i <= COLS; i++) {
          const p = pts[j][i];
          if (i === 0) ctx!.moveTo(p.sx, p.sy); else ctx!.lineTo(p.sx, p.sy);
        }
        ctx!.stroke();
      }
      for (let i = 0; i <= COLS; i++) {
        ctx!.strokeStyle = `rgba(${GOLD},0.07)`;
        ctx!.beginPath();
        for (let j = 0; j <= ROWS; j++) {
          const p = pts[j][i];
          if (j === 0) ctx!.moveTo(p.sx, p.sy); else ctx!.lineTo(p.sx, p.sy);
        }
        ctx!.stroke();
      }

      // узлы на гребнях разгораются
      ctx!.globalCompositeOperation = "lighter";
      for (let j = 0; j <= ROWS; j++) {
        for (let i = 0; i <= COLS; i++) {
          const p = pts[j][i];
          const depth = 1 - j / ROWS;
          const a = Math.pow(p.crest, 2.2) * depth * 0.9;
          if (a < 0.04) continue;
          const r = (1.4 + p.crest * 2.6) * (0.5 + depth * 0.6);
          ctx!.shadowBlur = 10 * p.crest * depth;
          ctx!.shadowColor = `rgba(${GOLD},${a})`;
          ctx!.fillStyle = `rgba(${GOLD},${a})`;
          ctx!.beginPath(); ctx!.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx!.fill();
        }
      }
      ctx!.shadowBlur = 0;
      ctx!.globalCompositeOperation = "source-over";
    }

    let raf = 0, running = true;
    const loop = () => { if (running) { t += 0.016; draw(); } raf = requestAnimationFrame(loop); };

    build();
    if (reduce) { draw(); return () => {}; }
    loop();

    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onResize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); build(); };
    window.addEventListener("resize", onResize);

    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
