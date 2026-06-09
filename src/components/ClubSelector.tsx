"use client";

// Выбор компании в стиле «выбор клуба в FIFA»: 3D-коверфлоу с фокусной
// центральной карточкой-гербом, по бокам — уменьшенные с поворотом; снизу —
// панель с информацией о выбранной компании. Управление: стрелки, клик по
// боковой карточке, свайп, клавиши ←/→. Плавные анимации (Framer Motion).
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export type ClubItem = {
  id: string;
  name: string;
  sector: string;
  logoUrl: string | null;
  valuation: string;
  ret: string;
  exit: string;
  potential: string;
  isHot: boolean;
};

export function ClubSelector({ items }: { items: ClubItem[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const n = items.length;
  if (n === 0) return null;

  const go = (d: number) => setActive((a) => (a + d + n) % n);
  const cur = items[active];

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      className="relative outline-none"
    >
      {/* Сцена-коверфлоу */}
      <div className="relative mx-auto h-[300px] w-full max-w-3xl [perspective:1300px] sm:h-[340px]">
        {/* свет за центральной карточкой */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[90px]" />

        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          drag={reduce ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(1);
            else if (info.offset.x > 60) go(-1);
          }}
        >
          {items.map((it, i) => {
            let off = i - active;
            if (off > n / 2) off -= n;
            if (off < -n / 2) off += n;
            if (Math.abs(off) > 2) return null;
            const isCenter = off === 0;
            return (
              <motion.button
                key={it.id}
                type="button"
                onClick={() => (isCenter ? null : setActive(i))}
                animate={{
                  x: off * 190,
                  scale: isCenter ? 1 : 0.72,
                  rotateY: reduce ? 0 : off * -26,
                  opacity: Math.abs(off) === 2 ? 0.3 : isCenter ? 1 : 0.6,
                  filter: isCenter ? "blur(0px)" : "blur(2px)",
                  zIndex: 10 - Math.abs(off),
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="absolute left-1/2 top-1/2 -ml-[110px] -mt-[140px] h-[280px] w-[220px] cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
              >
                <Crest item={it} center={isCenter} />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Стрелки */}
        <button
          type="button"
          aria-label="Предыдущая"
          onClick={() => go(-1)}
          className="absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/80 text-xl text-text-primary backdrop-blur transition-colors hover:border-brand hover:text-brand"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Следующая"
          onClick={() => go(1)}
          className="absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/80 text-xl text-text-primary backdrop-blur transition-colors hover:border-brand hover:text-brand"
        >
          ›
        </button>
      </div>

      {/* Панель информации о выбранной компании */}
      <div className="mx-auto mt-2 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={cur.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-center text-2xl font-bold text-text-primary sm:text-3xl">{cur.name}</h3>
              {cur.isHot && (
                <span className="kicker rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-warning">
                  Hot
                </span>
              )}
            </div>
            <p className="mt-1 text-center text-sm text-text-muted">{cur.sector}</p>

            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-4">
              <Stat label="Оценка" value={cur.valuation} />
              <Stat label="Доходность" value={cur.ret} accent />
              <Stat label="Выход" value={cur.exit} />
              <Stat label="Потенциал" value={cur.potential} accent />
            </div>

            <div className="mt-5 flex justify-center">
              <Link
                href={`/project/${cur.id}`}
                className="glow-brand rounded-control bg-brand px-7 py-3 font-semibold text-bg transition-all hover:brightness-110"
              >
                Открыть сделку →
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Рейл логотипов */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-label={it.name}
              onClick={() => setActive(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === active ? "w-7 bg-brand" : "w-2.5 bg-border hover:bg-text-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Crest({ item, center }: { item: ClubItem; center: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-4 rounded-card border bg-surface p-6 transition-colors ${
        center ? "border-brand shadow-[var(--shadow-card-hover)]" : "border-border"
      }`}
    >
      <div
        className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border bg-surface-alt ${
          center ? "border-brand/40" : "border-border"
        }`}
      >
        {item.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.logoUrl} alt={item.name} className="h-14 w-14 object-contain" />
        ) : (
          <span className="text-4xl font-bold text-text-muted">{item.name.charAt(0)}</span>
        )}
      </div>
      <span className="line-clamp-1 text-center text-base font-semibold text-text-primary">{item.name}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface p-4 text-center">
      <p className="kicker text-text-muted">{label}</p>
      <p className={`nums mt-1 text-lg font-bold ${accent ? "text-brand" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}
