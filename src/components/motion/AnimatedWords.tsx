"use client";

// Появление заголовка по словам (staggered word reveal)
import { motion } from "motion/react";

export function AnimatedWords({
  text,
  className,
  delay = 0,
  highlight,
}: {
  text: string;
  className?: string;
  delay?: number;
  // слова, которые подсветить градиентом (по совпадению)
  highlight?: string[];
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => {
        const isHl = highlight?.some((h) =>
          word.toLowerCase().includes(h.toLowerCase())
        );
        return (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block whitespace-nowrap"
            initial={{ opacity: 0, y: "0.5em", filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className={isHl ? "gradient-text" : undefined}>{word}</span>
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        );
      })}
    </span>
  );
}
