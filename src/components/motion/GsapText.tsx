"use client";

// Эффектное появление текста по словам (маскированный «подъём») на скролле — GSAP.
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

export function GsapText({
  text,
  className,
  highlight,
}: {
  text: string;
  className?: string;
  highlight?: string[];
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const els = ref.current?.querySelectorAll(".gw");
      if (!els) return;
      gsap.from(els, {
        yPercent: 110,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => {
        const hl = highlight?.some((h) =>
          w.toLowerCase().includes(h.toLowerCase())
        );
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <span className={`gw inline-block ${hl ? "gradient-text" : ""}`}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          </span>
        );
      })}
    </span>
  );
}
