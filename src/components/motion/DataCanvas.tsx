"use client";

// Генеративный canvas-фон «Млечный Путь»: плотная мерцающая россыпь звёзд вдоль
// диагональной галактической полосы + цветные туманности (аддитивно). Компании —
// крупные яркие именованные звёзды с белым ядром, свечением и подписью.
// Единый rAF, пауза вне вьюпорта, reduced-motion → статичный кадр.
import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number };
type Company = { x: number; y: number; r: number; vx: number; vy: number; label: string; ph: number };
type Cloud = { x: number; y: number; r: number; c: string };

export function DataCanvas({
  labels = [],
  density = 46,
  className = "",
}: {
  labels?: string[];
  density?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const BRAND = "39,224,168";
    const ACCENT = "127,217,255";
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let companies: Company[] = [];
    let clouds: Cloud[] = [];
    let t = 0;

    // Центр галактической полосы — лёгкая диагональ
    const slope = -0.22;
    const band = (x: number) => h * 0.46 + (x - w * 0.5) * slope;
    // Колоколообразное распределение ~[-1,1] для сгущения у полосы
    const bell = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(560, Math.max(180, Math.floor((w * h) / 2200)));
      stars = Array.from({ length: count }, () => {
        const inBand = Math.random() < 0.74;
        const x = Math.random() * w;
        const y = inBand ? band(x) + bell() * h * 0.2 : Math.random() * h;
        const r = inBand ? Math.random() * 1.2 + 0.35 : Math.random() * 0.9 + 0.25;
        const a = (inBand ? 0.6 : 0.4) * (Math.random() * 0.6 + 0.4);
        return { x, y, r, a, tw: 0.6 + Math.random() * 1.8, ph: Math.random() * Math.PI * 2 };
      });

      // Цветные туманности вдоль полосы
      const n = Math.max(3, Math.floor(w / 420));
      clouds = Array.from({ length: n }, (_, i) => {
        const x = ((i + 0.5) / n) * w + (Math.random() - 0.5) * 140;
        const y = band(x) + (Math.random() - 0.5) * h * 0.12;
        return { x, y, r: h * (0.3 + Math.random() * 0.24), c: Math.random() < 0.5 ? BRAND : ACCENT };
      });

      // Компании — крупные именованные звёзды вдоль полосы
      companies = labels.map((label, i) => {
        const x = ((i + 0.5) / Math.max(1, labels.length)) * w + (Math.random() - 0.5) * 80;
        const y = band(x) + (Math.random() - 0.5) * h * 0.24;
        return {
          x, y,
          r: 6.5 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.07,
          vy: (Math.random() - 0.5) * 0.07,
          label,
          ph: Math.random() * Math.PI * 2,
        };
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Туманности + звёзды — аддитивно (свечение Млечного Пути)
      ctx!.globalCompositeOperation = "lighter";
      for (const c of clouds) {
        const g = ctx!.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, `rgba(${c.c},0.05)`);
        g.addColorStop(1, `rgba(${c.c},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath(); ctx!.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx!.fill();
      }
      for (const s of stars) {
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * s.tw + s.ph);
        ctx!.fillStyle = `rgba(224,238,242,${s.a * tw})`;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx!.fill();
      }
      ctx!.globalCompositeOperation = "source-over";

      // Компании — яркая звезда + белое ядро + свечение + подпись
      for (const c of companies) {
        if (!reduce) {
          c.x += c.vx; c.y += c.vy;
          if (c.x < 0 || c.x > w) c.vx *= -1;
          if (c.y < 0 || c.y > h) c.vy *= -1;
        }
        const pulse = reduce ? 1 : 0.82 + 0.18 * Math.sin(t * 1.2 + c.ph);
        ctx!.save();
        ctx!.shadowBlur = 20 * pulse;
        ctx!.shadowColor = `rgba(${BRAND},0.95)`;
        ctx!.fillStyle = `rgba(${BRAND},0.98)`;
        ctx!.beginPath(); ctx!.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx!.fill();
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = "rgba(240,255,250,0.92)";
        ctx!.beginPath(); ctx!.arc(c.x, c.y, c.r * 0.4, 0, Math.PI * 2); ctx!.fill();
        ctx!.restore();
        ctx!.fillStyle = "rgba(222,232,238,0.9)";
        ctx!.font = "600 14px Manrope, sans-serif";
        ctx!.fillText(c.label, c.x + c.r + 7, c.y + 4);
      }
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
  }, [labels, density]);

  return <canvas ref={ref} className={className} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
