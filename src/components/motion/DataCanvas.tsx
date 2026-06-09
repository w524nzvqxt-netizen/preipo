"use client";

// Генеративный canvas-фон: созвездие узлов-компаний, соединённых светящимися
// рёбрами; по рёбрам редко пробегают импульсы. Единый rAF, пауза вне вьюпорта,
// reduced-motion → статичный кадр.
import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; label?: string };

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
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    const pulses: { a: number; b: number; t: number; speed: number }[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(14, Math.min(density, Math.floor((w * h) / 22000)));
      nodes = Array.from({ length: count }, (_, i) => {
        const isCompany = i < labels.length;
        return {
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
          // узлы-компании заметно крупнее фоновых точек
          r: isCompany ? 4 : Math.random() * 1.6 + 1,
          label: isCompany ? labels[i] : undefined,
        };
      });
    }

    const LINK = 168;
    function frame() {
      ctx!.clearRect(0, 0, w, h);
      // рёбра
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const o = (1 - d / LINK) * 0.22;
            ctx!.strokeStyle = `rgba(${BRAND},${o})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke();
            if (!reduce && Math.random() < 0.0006) pulses.push({ a: i, b: j, t: 0, speed: 0.02 + Math.random() * 0.02 });
          }
        }
      }
      // импульсы
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k]; const a = nodes[p.a], b = nodes[p.b];
        if (!a || !b) { pulses.splice(k, 1); continue; }
        p.t += p.speed;
        if (p.t >= 1) { pulses.splice(k, 1); continue; }
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        ctx!.fillStyle = `rgba(${BRAND},0.9)`;
        ctx!.beginPath(); ctx!.arc(x, y, 1.8, 0, Math.PI * 2); ctx!.fill();
      }
      // узлы
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        if (n.label) {
          // компания — крупная светящаяся звезда + читаемая подпись
          ctx!.save();
          ctx!.shadowBlur = 14;
          ctx!.shadowColor = `rgba(${BRAND},0.9)`;
          ctx!.fillStyle = `rgba(${BRAND},0.95)`;
          ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx!.fill();
          ctx!.restore();
          ctx!.fillStyle = "rgba(214,224,230,0.82)";
          ctx!.font = "600 13px Manrope, sans-serif";
          ctx!.fillText(n.label, n.x + n.r + 6, n.y + 4);
        } else {
          ctx!.fillStyle = `rgba(${BRAND},0.55)`;
          ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx!.fill();
        }
      }
    }

    let raf = 0, running = true;
    const loop = () => { if (running) frame(); raf = requestAnimationFrame(loop); };

    resize();
    if (reduce) { frame(); return () => {}; }
    loop();

    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onResize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); };
    window.addEventListener("resize", onResize);

    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); };
  }, [labels, density]);

  return <canvas ref={ref} className={className} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
