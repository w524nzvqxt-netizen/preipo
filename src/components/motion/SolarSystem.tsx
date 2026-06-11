"use client";

// Солнечная система компаний с «настоящим» небом:
// — днём светит Солнце (живое фото NASA SDO, медленно вращается + корона);
// — ночью вместо него Луна;
// — светило встаёт по времени суток (утро — слева/низко, полдень — вверху,
//   вечер — справа), т.е. примерно «с той стороны, где сейчас человек»
//   (по его локальному времени/часовому поясу);
// — компании-планеты вращаются вокруг, радиус и размер ∝ капитализации.
// reduced-motion → статичный кадр.
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

const COLORS = ["#7FD9FF", "#9F8CFF", "#FF9F7F", "#34E5A0", "#F0616D", "#E0A93B", "#27E0A8"];

// hex → rgba со своей альфой
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
// линейное смешение двух hex-цветов
function mixHex(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  const r = Math.round(((na >> 16) & 255) * (1 - t) + ((nb >> 16) & 255) * t);
  const g = Math.round(((na >> 8) & 255) * (1 - t) + ((nb >> 8) & 255) * t);
  const bl = Math.round((na & 255) * (1 - t) + (nb & 255) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

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
    let nx = 0, ny = 0, tnx = 0, tny = 0; // сглаженный параллакс (текущее → цель)
    let glow = 0.6, glowTarget = 0.6;
    let scrollY = 0;

    // фото Солнца (NASA SDO, public domain)
    const sunImg = new Image();
    sunImg.src = "/uploads/sun.jpg";

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
      const baseR = unit * 0.16, stepR = unit * 0.13;
      bodies = sorted.map((p, i) => {
        const norm = maxC > minC ? (Math.sqrt(p.cap) - minC) / (maxC - minC) : 0.5;
        return {
          name: p.name,
          label: capLabel(p.cap),
          orbit: baseR + i * stepR,
          size: 5 + norm * 12,
          a0: (i / sorted.length) * Math.PI * 2 + i * 0.7,
          speed: 0.12 / (1 + i * 0.5),
          color: COLORS[i % COLORS.length],
        };
      });
    }

    // Положение солнца: по горизонтали — по времени суток; по вертикали —
    // плавный спуск при прокрутке, но только до нижней кромки hero (≈ начало
    // второго раздела), дальше не опускается.
    function skyPos() {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const dayProg = Math.min(Math.max((hour - 6) / 13, 0), 1); // утро 0 … вечер 1
      const elev = Math.sin(dayProg * Math.PI); // зенит в полдень
      const cx = w * (0.16 + dayProg * 0.68) + nx * 28;

      const cyStart = h * (0.3 - elev * 0.16); // выше в полдень
      const cyTarget = h * 0.9; // у границы второго раздела
      const p = Math.min(Math.max(scrollY / (h * 0.85), 0), 1);
      const eased = p * p * (3 - 2 * p); // smoothstep
      const cy = cyStart + eased * (cyTarget - cyStart) + ny * 16;
      return { cx, cy };
    }

    function drawSun(cx: number, cy: number, r: number) {
      const pulse = reduce ? 1 : 0.94 + 0.06 * Math.sin(t * 1.2);
      const g = glow * pulse;
      const coronaR = r * (3.0 + (reduce ? 0 : 0.22 * Math.sin(t * 0.8)));

      // Свечение и лучи — аддитивно (мягкий объёмный свет)
      ctx!.save();
      ctx!.globalCompositeOperation = "lighter";

      const c1 = ctx!.createRadialGradient(cx, cy, r * 0.5, cx, cy, coronaR);
      c1.addColorStop(0, `rgba(255,216,110,${0.4 * g})`);
      c1.addColorStop(0.45, `rgba(255,170,55,${0.16 * g})`);
      c1.addColorStop(1, "rgba(255,150,30,0)");
      ctx!.fillStyle = c1;
      ctx!.beginPath(); ctx!.arc(cx, cy, coronaR, 0, Math.PI * 2); ctx!.fill();

      ctx!.restore();

      // Диск: фото NASA (плазма 171Å) + «живой» слой → шевелящаяся поверхность
      if (sunImg.complete && sunImg.naturalWidth > 0) {
        const s = r * 2.16;
        ctx!.save();
        ctx!.beginPath(); ctx!.arc(cx, cy, r, 0, Math.PI * 2); ctx!.clip();

        // базовый слой, медленно вращается
        ctx!.save();
        ctx!.translate(cx, cy);
        if (!reduce) ctx!.rotate(t * 0.02);
        ctx!.drawImage(sunImg, -s / 2, -s / 2, s, s);
        ctx!.restore();

        // живой слой: аддитивно, в противофазе и пульсирует — плазма «дышит»
        if (!reduce) {
          ctx!.save();
          ctx!.globalCompositeOperation = "lighter";
          ctx!.globalAlpha = 0.22 + 0.12 * Math.sin(t * 1.3);
          ctx!.translate(cx, cy);
          ctx!.rotate(-t * 0.014);
          const s2 = s * (1.05 + 0.03 * Math.sin(t * 0.9));
          ctx!.drawImage(sunImg, -s2 / 2, -s2 / 2, s2, s2);
          ctx!.restore();
        }
        ctx!.restore();
      } else {
        const core = ctx!.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
        core.addColorStop(0, "#FFFDF0"); core.addColorStop(0.5, "#FFE066"); core.addColorStop(1, "#FFB400");
        ctx!.fillStyle = core;
        ctx!.beginPath(); ctx!.arc(cx, cy, r, 0, Math.PI * 2); ctx!.fill();
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      glow += (glowTarget - glow) * 0.06;
      nx += (tnx - nx) * 0.05; // плавный «доезд» параллакса
      ny += (tny - ny) * 0.05;
      const { cx, cy } = skyPos();
      const r = Math.min(w, h) * 0.085;
      const reach = Math.max(w, h) * 0.95;

      // орбиты
      ctx!.lineWidth = 1;
      for (const b of bodies) {
        ctx!.strokeStyle = "rgba(255,255,255,0.06)";
        ctx!.beginPath(); ctx!.arc(cx, cy, b.orbit, 0, Math.PI * 2); ctx!.stroke();
      }

      // Свет солнца разливается по всей системе (аддитивно)
      ctx!.save();
      ctx!.globalCompositeOperation = "lighter";
      const wash = ctx!.createRadialGradient(cx, cy, r * 0.8, cx, cy, reach);
      wash.addColorStop(0, `rgba(255,200,90,${0.12 * glow})`);
      wash.addColorStop(0.5, `rgba(255,170,60,${0.045 * glow})`);
      wash.addColorStop(1, "rgba(255,150,30,0)");
      ctx!.fillStyle = wash;
      ctx!.fillRect(0, 0, w, h);
      ctx!.restore();

      drawSun(cx, cy, r);

      // планеты — объёмные сферы, освещённые солнцем
      for (const b of bodies) {
        const ang = reduce ? b.a0 : b.a0 + t * b.speed;
        const x = cx + Math.cos(ang) * b.orbit;
        const y = cy + Math.sin(ang) * b.orbit;
        const dx = cx - x, dy = cy - y;
        const dist = Math.hypot(dx, dy);
        const lit = 0.5 + 0.5 * Math.max(0, 1 - dist / (reach * 0.7));
        const a2 = Math.atan2(dy, dx); // направление на солнце

        // Кометный след — мягкая дуга позади планеты по её орбите
        if (!reduce) {
          ctx!.save();
          ctx!.globalCompositeOperation = "lighter";
          const trail = 0.42;
          const grad = ctx!.createLinearGradient(
            cx + Math.cos(ang - trail) * b.orbit, cy + Math.sin(ang - trail) * b.orbit, x, y
          );
          grad.addColorStop(0, hexA(b.color, 0));
          grad.addColorStop(1, hexA(b.color, 0.26));
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = b.size * 0.7;
          ctx!.lineCap = "round";
          ctx!.beginPath();
          ctx!.arc(cx, cy, b.orbit, ang - trail, ang);
          ctx!.stroke();
          ctx!.restore();
        }

        // Внешнее мягкое свечение
        ctx!.save();
        ctx!.globalCompositeOperation = "lighter";
        const halo = ctx!.createRadialGradient(x, y, b.size * 0.4, x, y, b.size * 2.7);
        halo.addColorStop(0, hexA(b.color, 0.42 * (0.6 + 0.4 * lit)));
        halo.addColorStop(1, hexA(b.color, 0));
        ctx!.fillStyle = halo;
        ctx!.beginPath(); ctx!.arc(x, y, b.size * 2.7, 0, Math.PI * 2); ctx!.fill();
        ctx!.restore();

        // Сфера: освещённая сторона к солнцу → тёмный терминатор
        const lx = x + Math.cos(a2) * b.size * 0.5;
        const ly = y + Math.sin(a2) * b.size * 0.5;
        const sphere = ctx!.createRadialGradient(lx, ly, b.size * 0.1, x, y, b.size * 1.06);
        sphere.addColorStop(0, mixHex(b.color, "#ffffff", 0.5));
        sphere.addColorStop(0.5, b.color);
        sphere.addColorStop(1, mixHex(b.color, "#05070a", 0.55));
        ctx!.fillStyle = sphere;
        ctx!.beginPath(); ctx!.arc(x, y, b.size, 0, Math.PI * 2); ctx!.fill();

        // Тёплый солнечный блик-кромка
        ctx!.save();
        ctx!.globalCompositeOperation = "lighter";
        ctx!.fillStyle = `rgba(255,240,205,${0.5 * lit})`;
        ctx!.beginPath();
        ctx!.arc(lx, ly, b.size * 0.4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();

        // Подписи: справа — справа от планеты, слева — плавно гаснут у заголовка
        if (w >= 720) {
          const side = x > w * 0.46 ? 1 : -1;
          const labelAlpha = side === 1 ? 1 : Math.min(1, Math.max(0, (x - w * 0.3) / (w * 0.12)));
          if (labelAlpha > 0.05) {
            ctx!.save();
            ctx!.globalAlpha = labelAlpha;
            ctx!.textAlign = side === 1 ? "left" : "right";
            ctx!.shadowColor = "rgba(0,0,0,0.85)"; ctx!.shadowBlur = 8;
            const tx = x + side * (b.size + 8);
            ctx!.fillStyle = "rgba(236,241,244,0.95)";
            ctx!.font = "600 13px Manrope, sans-serif";
            ctx!.fillText(b.name, tx, y + 1);
            ctx!.fillStyle = "rgba(157,172,182,0.9)";
            ctx!.font = "600 11px Manrope, sans-serif";
            ctx!.fillText(b.label, tx, y + 15);
            ctx!.restore();
          }
        }
      }
    }

    let raf = 0, running = true;
    const loop = () => { if (running) { t += 0.016; draw(); } raf = requestAnimationFrame(loop); };

    build();
    sunImg.onload = () => { if (reduce) draw(); };
    if (reduce) { draw(); return () => {}; }
    loop();

    let decay: ReturnType<typeof setTimeout>;
    function onMove(e: PointerEvent) {
      tnx = e.clientX / window.innerWidth - 0.5;
      tny = e.clientY / window.innerHeight - 0.5;
      glowTarget = 1;
      clearTimeout(decay);
      decay = setTimeout(() => { glowTarget = 0.6; }, 240);
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
