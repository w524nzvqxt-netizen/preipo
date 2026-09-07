"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // журналируем на клиенте; серверные ошибки уже в логах Next
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="kicker text-brand">Ошибка</p>
      <h1 className="mt-3 text-3xl font-bold text-text-primary sm:text-4xl">Что-то пошло не так</h1>
      <p className="mt-3 text-text-secondary">Мы уже знаем о проблеме. Попробуйте обновить страницу.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-brand rounded-control px-5 py-2.5 text-sm font-semibold">Обновить</button>
        <Link href="/" className="rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand">На главную</Link>
      </div>
    </main>
  );
}
