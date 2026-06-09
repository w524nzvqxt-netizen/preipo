"use client";

// Солнечная система компаний: жёлтое солнце в центре, планеты-компании на
// орбитах. Радиус орбиты и размер планеты — по капитализации (крупнее =
// ближе к солнцу и больше). Солнце разгорается при движении мыши и опускается
// при прокрутке (закат). reduced-motion → статичный кадр.
import { useEffect, useRef } from "react";

export type Planet = { name: string; cap: number };

function capLabel(cap: number): string {
  const b = cap / 1e9;
  if (b >= 1) {
    const v = b >= 100 ? Math.round(b) : Math.round(b * 10) / 10;
    return `$${String(v).replace(".", ",")}B`;
  }
  return `$${Math.round(cap / 1e6)}M`;
}

// мягкая палитра планет
const COLORS = ["#7FD9FF", "#9F8CFF", "#FF9F7F", "#34E5A0", "#F0616D", "#E0A93B", "#27E0A8"];

export function SolarSystem({ planets, className = "" }: { planets: Planet[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let t = 0;

    // курсор/скролл
    let nx = 0, ny = 0;           // нормализованный курсор [-0.5..0.5]
    let glow = 0.55, glowTarget = 0.55;
    let scrollY = 0;

    // сортировка по капитализации: крупнейшие — ближе к солнцу
    const sorted = [...planets].filter((p) => p.cap > 0).sort((a, b) => b.cap - a.cap);
    const caps = sorted.map((p) => Math.sqrt(p.cap));
    const minC = Math.min(...caps, 1), maxC = Math.max(...caps, 1);

    type Body = { name: string; label: string; orbit: number; size: number; a0: number; speed: number; color: string };
    let bodies: Body[] = [];

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const unit = Math.min(w, h);
      const baseR = unit * 0.16;
      const stepR = unit * 0.13;
      bodies = sorted.map((p, i) => {
        const norm = maxC > minC ? (Math.sqrt(p.cap) - minC) / (maxC - minC) : 0.5;
        return {
          name: p.name,
          label: capLabel(p.cap),
          orbit: baseR + i * stepR,          // крупнейшие — внутренние орбиты
          size: 5 + norm * 12,               // размер ∝ капитализации
          a0: (i / sorted.length) * Math.PI * 2 + i * 0.7,
          speed: 0.18 / (1 + i * 0.55),      // внутренние быстрее (как у планет)
          color: COLORS[i % COLORS.length],
        };
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      glow += (glowTarget - glow) * 0.08;

      const cx = w * 0.5 + nx * 36;
      const descend = Math.min(scrollY, 900) / 900 * (h * 0.5);
      const cy = h * 0.42 + ny * 22 + descend;

      // орбиты
      ctx!.lineWidth = 1;
      for (const b of bodies) {
        ctx!.strokeStyle = "rgba(255,255,255,0.06)";
        ctx!.beginPath(); ctx!.arc(cx, cy, b.orbit, 0, Math.PI * 2); ctx!.stroke();
      }

      // солнце (жёлтое) + корона по glow
      const sunR = Math.min(w, h) * 0.075;
      const corona = ctx!.createRadialGradient(cx, cy, 0, cx, cy, sunR * 4.2);
      corona.addColorStop(0, `rgba(255,247,200,${0.55 * glow})`);
      corona.addColorStop(0.18, `rgba(255,214,59,${0.5 * glow})`);
      corona.addColorStop(0.45, `rgba(255,180,20,${0.18 * glow})`);
      corona.addColorStop(1, "rgba(255,180,20,0)");
      ctx!.fillStyle = corona;
      ctx!.beginPath(); ctx!.arc(cx, cy, sunR * 4.2, 0, Math.PI * 2); ctx!.fill();

      const core = ctx!.createRadialGradient(cx - sunR * 0.2, cy - sunR * 0.2, 0, cx, cy, sunR);
      core.addColorStop(0, "#FFFDF0");
      core.addColorStop(0.5, "#FFE066");
      core.addColorStop(1, "#FFB400");
      ctx!.fillStyle = core;
      ctx!.beginPath(); ctx!.arc(cx, cy, sunR, 0, Math.PI * 2); ctx!.fill();

      // планеты
      for (const b of bodies) {
        const ang = reduce ? b.a0 : b.a0 + t * b.speed;
        const x = cx + Math.cos(ang) * b.orbit;
        const y = cy + Math.sin(ang) * b.orbit;

        ctx!.save();
        ctx!.shadowBlur = 14;
        ctx!.shadowColor = b.color;
        ctx!.fillStyle = b.color;
        ctx!.beginPath(); ctx!.arc(x, y, b.size, 0, Math.PI * 2); ctx!.fill();
        ctx!.restore();

        // подпись: имя + капитализация
        ctx!.fillStyle = "rgba(236,241,244,0.92)";
        ctx!.font = "600 13px Manrope, sans-serif";
        ctx!.fillText(b.name, x + b.size + 7, y + 1);
        ctx!.fillStyle = "rgba(157,172,182,0.85)";
        ctx!.font = "600 11px Manrope, sans-serif";
        ctx!.fillText(b.label, x + b.size + 7, y + 15);
      }
    }

    let raf = 0, running = true;
    const loop = () => { if (running) { t += 0.016; draw(); } raf = requestAnimationFrame(loop); };

    build();
    if (reduce) { draw(); return () => {}; }
    loop();

    let decay: ReturnType<typeof setTimeout>;
    function onMove(e: PointerEvent) {
      nx = e.clientX / window.innerWidth - 0.5;
      ny = e.clientY / window.innerHeight - 0.5;
      glowTarget = 1;
      clearTimeout(decay);
      decay = setTimeout(() => { glowTarget = 0.55; }, 240);
    }
    function onScroll() { scrollY = window.scrollY; }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onResize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); build(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(decay);
    };
  }, [planets]);

  return <canvas ref={ref} className={className} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
