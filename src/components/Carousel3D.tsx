"use client";

// 3D-витрина «Компании на орбите» (React Three Fiber + drei).
// Карточки расставлены по окружности и медленно вращаются вокруг ядра, всегда
// оставаясь лицом к зрителю (billboard). При наведении орбита замирает, а из
// карточки «лучами солнца» расходятся ключевые факты компании.
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AnimatePresence, motion } from "motion/react";
import type { Group } from "three";

export type OrbitItem = {
  id: string;
  name: string;
  subtitle: string;
  logoUrl: string | null;
  facts: { label: string; value: string }[];
};

const RADIUS = 3.4; // радиус орбиты
const SPEED = 0.12; // скорость авто-вращения (рад/с)

export function Carousel3D({ items }: { items: OrbitItem[] }) {
  return (
    <div className="relative z-10 h-[68vh] min-h-[460px] w-full">
      <Canvas camera={{ position: [0, 0.4, 8], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <Scene items={items} />
      </Canvas>
    </div>
  );
}

function Scene({ items }: { items: OrbitItem[] }) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useFrame((_, delta) => {
    if (group.current && hovered === null) {
      group.current.rotation.y += delta * SPEED;
    }
  });

  return (
    <group ref={group}>
      {items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        const x = Math.sin(angle) * RADIUS;
        const z = Math.cos(angle) * RADIUS;
        return (
          <group key={item.id} position={[x, 0, z]}>
            <Html center distanceFactor={9} zIndexRange={[20, 0]} pointerEvents="auto">
              <OrbitCard
                item={item}
                open={hovered === item.id}
                onHover={(v) => setHovered(v ? item.id : null)}
              />
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function OrbitCard({
  item,
  open,
  onHover,
}: {
  item: OrbitItem;
  open: boolean;
  onHover: (v: boolean) => void;
}) {
  return (
    <div
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className="relative"
      style={{ width: 200 }}
    >
      {/* Лучи-факты вокруг карточки */}
      <Rays facts={item.facts} open={open} />

      {/* Сама карточка */}
      <motion.div
        animate={{ scale: open ? 1.06 : 1, y: open ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`glass relative z-10 rounded-card p-4 text-center transition-colors ${
          open ? "border-brand glow-brand" : ""
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-control border border-border bg-surface-alt">
          {item.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.logoUrl} alt={item.name} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-xl font-bold text-text-muted">{item.name.charAt(0)}</span>
          )}
        </div>
        <h3 className="mt-3 text-base font-semibold leading-tight text-text-primary">{item.name}</h3>
        <p className="kicker mt-1 text-text-muted">{item.subtitle}</p>
      </motion.div>
    </div>
  );
}

// «Лучи солнца»: факты расходятся из центра карточки по дуге сверху.
function Rays({ facts, open }: { facts: OrbitItem["facts"]; open: boolean }) {
  const n = facts.length;
  // равномерный веер сверху: от -70° до +70°
  const spread = 140;
  const step = n > 1 ? spread / (n - 1) : 0;

  return (
    <AnimatePresence>
      {open &&
        facts.map((f, i) => {
          const deg = -spread / 2 + i * step; // угол луча от вертикали
          const rad = (deg * Math.PI) / 180;
          const dist = 118; // длина луча
          const tx = Math.sin(rad) * dist;
          const ty = -Math.cos(rad) * dist;
          return (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, x: tx, y: ty, scale: 1 }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              transition={{ duration: 0.32, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 top-1/2 z-0"
              style={{ marginLeft: -52, marginTop: -20 }}
            >
              {/* луч-линия к центру */}
              <span
                className="absolute left-1/2 top-1/2 h-px origin-left bg-gradient-to-r from-brand/70 to-transparent"
                style={{
                  width: dist,
                  transform: `translate(-2px,-1px) rotate(${deg + 180}deg)`,
                }}
              />
              <div className="glass relative w-[104px] rounded-control px-2.5 py-1.5 text-center">
                <p className="kicker text-[9px] text-text-muted">{f.label}</p>
                <p className="nums text-sm font-bold text-brand">{f.value}</p>
              </div>
            </motion.div>
          );
        })}
    </AnimatePresence>
  );
}
