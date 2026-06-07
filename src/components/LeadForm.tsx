"use client";

// Форма заявки. После отправки лид сохраняется в базу (server action).
import { useActionState } from "react";
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
        <p className="font-semibold">Заявка отправлена ✓</p>
        <p className="mt-1 text-sm text-emerald-700/80">
          Мы свяжемся с вами в ближайшее время.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {projectName && (
        <p className="text-sm text-neutral-500">
          Заявка по проекту: <span className="font-medium text-neutral-900">{projectName}</span>
        </p>
      )}
      <input
        name="name"
        placeholder="Ваше имя"
        required
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 outline-none placeholder:text-neutral-400 focus:border-emerald-500"
      />
      <input
        name="contact"
        placeholder="Телефон, email или @telegram"
        required
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 outline-none placeholder:text-neutral-400 focus:border-emerald-500"
      />
      <textarea
        name="message"
        placeholder="Комментарий (необязательно)"
        rows={3}
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 outline-none placeholder:text-neutral-400 focus:border-emerald-500"
      />
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Отправляем…" : "Оставить заявку"}
      </button>
    </form>
  );
}
