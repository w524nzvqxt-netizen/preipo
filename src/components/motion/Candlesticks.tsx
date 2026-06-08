"use client";

// Живой график японских свечей: новые свечи приходят справа, лента плавно
// едет влево, общий тренд вверх. Зелёные (рост) / красные (падение), glow на
// последней. Один rAF, пауза вне вьюпорта, reduced-motion → статичный кадр.
import { useEffect, useRef } from "react";

type Candle = { o: number; h: number; l: number; c: number };

export function Candlesticks({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GREEN = "#34E5A0", RED = "#F0616D";
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const CW = 26; // ширина слота свечи
    let candles: Candle[] = [];
    let last = 100;
    let phase = 0; // 0..1 прогресс прихода новой свечи

    function gen(): Candle {
      const drift = 0.9; // тренд вверх
      const o = last;
      const c = Math.max(20, o + drift + (Math.random() - 0.46) * 9);
      const h = Math.max(o, c) + Math.random() * 4;
      const l = Math.min(o, c) - Math.random() * 4;
      last = c;
      return { o, h, l, c };
    }

    function fill() {
      const need = Math.ceil(w / CW) + 3;
      while (candles.length < need) candles.push(gen());
      if (candles.length > need + 2) candles = candles.slice(-(need + 2));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      fill();
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const vis = candles;
      let min = Infinity, max = -Infinity;
      for (const c of vis) { if (c.l < min) min = c.l; if (c.h > max) max = c.h; }
      const padT = h * 0.12, padB = h * 0.12;
      const Y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (h - padT - padB);

      const offset = phase * CW; // плавный сдвиг влево
      vis.forEach((c, i) => {
        const x = i * CW - offset + CW / 2;
        if (x < -CW || x > w + CW) return;
        const up = c.c >= c.o;
        const col = up ? GREEN : RED;
        const isLast = i === vis.length - 2;
        ctx!.globalAlpha = i === vis.length - 1 ? phase * 0.6 : 1; // последняя «въезжает»
        // фитиль
        ctx!.strokeStyle = col; ctx!.lineWidth = 1.5;
        ctx!.beginPath(); ctx!.moveTo(x, Y(c.h)); ctx!.lineTo(x, Y(c.l)); ctx!.stroke();
        // тело
        const yo = Y(c.o), yc = Y(c.c);
        const bw = CW * 0.56;
        if (isLast && !reduce) { ctx!.shadowColor = col; ctx!.shadowBlur = 16; }
        ctx!.fillStyle = col;
        ctx!.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(2, Math.abs(yc - yo)));
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 1;
      });
    }

    let raf = 0, running = true;
    function loop() {
      if (running) {
        if (!reduce) {
          phase += 0.018;
          if (phase >= 1) { phase = 0; candles.push(gen()); fill(); }
        }
        draw();
      }
      raf = requestAnimationFrame(loop);
    }

    resize();
    if (reduce) { draw(); return () => {}; }
    loop();

    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onResize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
