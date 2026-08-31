"use client";

// Мобильная навигация: бургер + СПЛОШНАЯ полноэкранная панель со всеми разделами.
// Фон непрозрачный (не .glass) — чтобы текст всегда был читаем на телефоне.
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

      {/* Полноэкранная панель */}
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#070A0F]">
          {/* Верхняя строка: бренд + закрыть */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
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

          {/* Ссылки */}
          <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-3">
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
      )}
    </div>
  );
}
