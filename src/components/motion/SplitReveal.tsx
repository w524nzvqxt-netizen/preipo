"use client";

// Кинетический заголовок: появление по словам (clip-path снизу-вверх + y + blur).
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function SplitReveal({
  text,
  highlight = [],
  className = "",
  delay = 0,
  as: Tag = "h1",
}: {
  text: string;
  highlight?: string[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p";
}) {
  const words = text.split(" ");
  const ease = [0.16, 1, 0.3, 1] as const;
  const reduce = useReducedMotion();

  // При «уменьшить движение» — статичный заголовок, сразу читается целиком.
  if (reduce) {
    return (
      <Tag className={className}>
        {words.map((word, i) => {
          const hl = highlight.includes(word.replace(/[.,—]/g, ""));
          return (
            <span key={i}>
              <Word hl={hl}>{word}</Word>
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      {words.map((word, i) => {
        const clean = word.replace(/[.,—]/g, "");
        const hl = highlight.includes(clean);
        return (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={{ y: "0.5em", opacity: 0, filter: "blur(8px)" }}
              whileInView={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: delay + i * 0.05 }}
            >
              <Word hl={hl}>{word}</Word>
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

function Word({ hl, children }: { hl: boolean; children: ReactNode }) {
  if (!hl) return <>{children}</>;
  return (
    <span className="relative text-brand">
      {children}
      <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-brand/60" />
    </span>
  );
}
