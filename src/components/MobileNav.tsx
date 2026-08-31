"use client";

// Мобильная навигация: бургер + выезжающая СВЕРХУ панель со всеми разделами.
// ВАЖНО: панель рендерится порталом в <body>, а НЕ внутри шапки —
// у шапки .glass с backdrop-filter, который делает containing block и
// «ловит» position:fixed внутри тонкой полоски (из-за этого меню было не видно).
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = (
    <div
      className={`fixed inset-0 z-[9999] lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Затемнение */}
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Панель, выезжающая сверху */}
      <div
        className={`absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto bg-[#0B0F17] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            <span className="text-brand">◆</span> Pre-IPO
          </span>
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-control border border-border-strong bg-surface text-text-primary"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col px-5 pb-6 pt-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center justify-between border-b border-border/70 text-lg font-semibold text-text-primary active:text-brand"
            >
              {l.label}
              <span className="text-brand">→</span>
            </Link>
          ))}
          <a
            href="#quiz"
            onClick={() => setOpen(false)}
            className="btn-brand mt-6 flex min-h-14 items-center justify-center rounded-control text-base font-semibold"
          >
            Получить доступ
          </a>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      {/* Кнопка-бургер */}
      <button
        type="button"
        aria-label="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-control border border-border-strong bg-surface text-text-primary"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Панель — порталом в body, вне containing block шапки */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
