import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="kicker text-brand">404</p>
      <h1 className="mt-3 text-3xl font-bold text-text-primary sm:text-4xl">Страница не найдена</h1>
      <p className="mt-3 text-text-secondary">Похоже, ссылка устарела или страница была перемещена.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-brand rounded-control px-5 py-2.5 text-sm font-semibold">На главную</Link>
        <Link href="/base" className="rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand">Будущие гиганты</Link>
      </div>
    </main>
  );
}
