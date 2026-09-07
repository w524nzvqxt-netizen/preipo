"use client";

// Обёртка-клиент для ленивой загрузки тяжёлого 3D-стека (three.js +
// @react-three/fiber). next/dynamic с ssr:false обязан жить в клиентском
// компоненте — сам /lab остаётся серверным (запрос к БД).
import dynamic from "next/dynamic";
import type { OrbitItem } from "@/components/Carousel3D";

const Carousel3D = dynamic(() => import("@/components/Carousel3D").then((m) => m.Carousel3D), {
  ssr: false,
  loading: () => (
    <div className="relative z-10 flex h-[68vh] min-h-[460px] w-full items-center justify-center">
      <p className="kicker text-text-muted">Загружаем 3D-витрину…</p>
    </div>
  ),
});

export function Carousel3DLazy({ items }: { items: OrbitItem[] }) {
  return <Carousel3D items={items} />;
}
