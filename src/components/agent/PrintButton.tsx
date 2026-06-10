"use client";

// Кнопка «Печать / PDF» — скрывается при печати.
export function PrintButton({ label = "Печать / PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-control bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 print:hidden"
    >
      {label}
    </button>
  );
}
