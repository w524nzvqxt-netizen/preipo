// Layout защищённой части админки: проверка сессии + навигация
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { logout } from "../actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthed())) redirect("/admin/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold">
            Админка
          </Link>
          <Link href="/admin" className="text-neutral-500 hover:text-neutral-900">
            Проекты
          </Link>
          <Link
            href="/admin/leads"
            className="text-neutral-500 hover:text-neutral-900"
          >
            Заявки
          </Link>
          <Link
            href="/admin/agents"
            className="text-neutral-500 hover:text-neutral-900"
          >
            Агенты
          </Link>
          <Link
            href="/admin/quotes"
            className="text-neutral-500 hover:text-neutral-900"
          >
            Котировки
          </Link>
          <Link
            href="/"
            className="text-neutral-500 hover:text-neutral-900"
            target="_blank"
          >
            Витрина ↗
          </Link>
        </div>
        <form action={logout}>
          <button className="text-sm text-neutral-500 hover:text-red-500">
            Выйти
          </button>
        </form>
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
