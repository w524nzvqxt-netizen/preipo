"use client";

// Форма заявки. После отправки лид сохраняется в базу (server action).
import { useActionState } from "react";
import Link from "next/link";
import { submitLead, type LeadState } from "@/app/actions";

export function LeadForm({
  projectId,
  projectName,
}: {
  projectId?: string;
  projectName?: string;
}) {
  const [state, action, pending] = useActionState<LeadState, FormData>(
    submitLead,
    {}
  );

  if (state.ok) {
    return (
      <div className="rounded-control border border-border bg-brand-subtle p-5 text-text-primary">
        <p className="font-semibold">Заявка отправлена</p>
        <p className="mt-1 text-sm text-text-secondary">
          Мы свяжемся с вами в ближайшее время.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {projectName && (
        <p className="text-sm text-text-muted">
          Заявка по проекту:{" "}
          <span className="font-medium text-text-primary">{projectName}</span>
        </p>
      )}
      <input
        name="name"
        placeholder="Ваше имя"
        required
        className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <input
        name="contact"
        placeholder="Телефон, email или @telegram"
        required
        className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <textarea
        name="message"
        placeholder="Комментарий (необязательно)"
        rows={3}
        className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        />
        <span>
          Я согласен(а) на обработку персональных данных в соответствии с{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-brand underline hover:text-brand-hover"
          >
            Политикой обработки персональных данных
          </Link>{" "}
          и подтверждаю, что ознакомлен(а) с тем, что информация на сайте не
          является индивидуальной инвестиционной рекомендацией.
        </span>
      </label>
      {state.error && <p className="text-sm text-negative">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-control bg-brand px-4 py-2.5 font-semibold text-bg transition-colors hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Отправляем…" : "Оставить заявку"}
      </button>
    </form>
  );
}
