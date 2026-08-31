"use client";

// Мобильная навигация: бургер + полноэкранная панель со ВСЕМИ разделами.
// Нужна, потому что в шапке пункты скрыты на узких экранах (hidden lg:block).
import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS: { href: string; label: string }[] = [
  { href: "#deals", label: "Сделки" },
  { href: "#process", label: "Как это работает" },
  { href: "#risks", label: "Риски" },
  { href: "/exits", label: "Аналитика" },
  { href: "/base", label: "Будущие гиганты" },
  { href: "/academy", label: "Академия" },
  { href: "/agent", label: "Партнёрам" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[70] flex h-10 w-10 items-center justify-center rounded-control border border-border text-text-primary transition-colors hover:border-brand/50"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition-all duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="glass absolute inset-x-0 top-0 flex flex-col gap-1 px-6 pb-6 pt-20">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-control px-3 text-base font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="#quiz"
              onClick={() => setOpen(false)}
              className="btn-brand mt-2 flex min-h-12 items-center justify-center rounded-control px-4 text-base font-semibold"
            >
              Получить доступ
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
