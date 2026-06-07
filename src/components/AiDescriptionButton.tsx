"use client";

// Кнопка AI-генерации описания проекта
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AiState } from "@/app/admin/actions";

export function AiDescriptionButton({
  action,
  label = "✨ Сгенерировать описание (AI)",
  pendingLabel = "✨ Генерирую…",
  note = "AI-текст может содержать неточности — проверьте факты перед публикацией.",
}: {
  // action уже привязан к projectId через .bind(null, projectId)
  action: (prev: AiState, formData: FormData) => Promise<AiState>;
  label?: string;
  pendingLabel?: string;
  note?: string;
}) {
  const [state, formAction, pending] = useActionState<AiState, FormData>(
    action,
    {}
  );
  const router = useRouter();

  // После успешной операции обновляем страницу, чтобы подтянуть новый текст
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 sm:w-auto"
      >
        {pending ? pendingLabel : label}
      </button>
      {state.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
      {state.ok && (
        <p className="mt-2 text-sm text-emerald-600">
          Готово — проверьте и при необходимости отредактируйте.
        </p>
      )}
      {note && <p className="mt-2 text-xs text-neutral-400">{note}</p>}
    </form>
  );
}
