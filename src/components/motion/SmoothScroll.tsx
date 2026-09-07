"use client";

// Плавный инерционный скролл (Lenis) + синхронизация с GSAP ScrollTrigger.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Админка и кабинет агента — обычный UI с таблицами/формами: инерционный
// скролл там не нужен и мешает (напр. внутри модалок/списков), плюс не грузим
// GSAP+Lenis зря на этих маршрутах.
function isCinematicRoute(pathname: string): boolean {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/agent");
}

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const cinematic = isCinematicRoute(pathname);

  useEffect(() => {
    // На тач-устройствах и при reduced-motion — нативный скролл (быстрее, без дрожания)
    if (
      !cinematic ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.remove(onTick);
    };
  }, [cinematic]);

  // При смене маршрута — мгновенно наверх. Иначе Lenis держит позицию прошлой
  // страницы, и переход на карточку проекта открывается «снизу».
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
