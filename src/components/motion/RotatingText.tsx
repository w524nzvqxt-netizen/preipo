"use client";

// Сменяющиеся слова (динамический слоган)
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function RotatingText({
  words,
  className,
  interval = 2200,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="relative inline-grid">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          className={`gradient-text ${className ?? ""}`}
          initial={{ opacity: 0, y: "0.6em", filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: "-0.6em", filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
