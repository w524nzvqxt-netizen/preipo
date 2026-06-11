"use client";

// Квиз подбора сделок вместо обычной формы: 4 вопроса о профиле инвестора →
// контакт → лид падает в базу через submitLead (ответы упакованы в message,
// оператор видит их и в Telegram-уведомлении). Спокойный private-banking тон.
import { useActionState, useState } from "react";
import Link from "next/link";
import { submitLead, type LeadState } from "@/app/actions";

type Step = {
  key: string;
  q: string;
  hint?: string;
  options: string[];
  multi?: boolean;
};

const STEPS: Step[] = [
  {
    key: "Объём",
    q: "Какой объём инвестиций рассматриваете?",
    options: ["до $50k", "$50–100k", "$100–500k", "$500k+"],
  },
  {
    key: "Статус",
    q: "Ваш инвестиционный статус",
    hint: "Часть сделок доступна только квалифицированным инвесторам.",
    options: ["Квалифицированный инвестор", "Не квалифицированный", "Не знаю"],
  },
  {
    key: "Интерес",
    q: "Что интересно в первую очередь?",
    hint: "Можно выбрать несколько.",
    multi: true,
    options: ["AI", "SpaceX", "Финтех", "Defense", "Дата-центры", "Другое"],
  },
  {
    key: "Горизонт",
    q: "Горизонт инвестирования",
    options: ["1–2 года", "3–5 лет", "5+ лет"],
  },
];

const TOTAL = STEPS.length + 1; // + шаг контакта

export function InvestorQuiz() {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, {});
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  if (state.ok) {
    return (
      <div className="rounded-card border border-border bg-brand-subtle p-6">
        <p className="text-lg font-semibold text-text-primary">Спасибо, профиль получен</p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Подберём 3–5 сделок под ваш профиль и свяжемся в ближайшее время.
          Доступ к деталям сделок предоставляется индивидуально.
        </p>
      </div>
    );
  }

  const isContact = step === STEPS.length;
  const current = STEPS[step];

  function toggle(key: string, value: string, multi?: boolean) {
    setAnswers((prev) => {
      const cur = prev[key] ?? [];
      if (multi) {
        return { ...prev, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
      }
      return { ...prev, [key]: [value] };
    });
  }

  const chosen = current ? answers[current.key] ?? [] : [];
  const canNext = isContact || chosen.length > 0;

  const summary = STEPS.map((s) => `${s.key}: ${(answers[s.key] ?? []).join(", ") || "—"}`).join("\n");

  return (
    <div>
      {/* Прогресс */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <p className="kicker text-text-muted">Шаг {step + 1} из {TOTAL}</p>
          <p className="kicker text-text-muted">Подбор сделок</p>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-pill bg-border">
          <div
            className="h-full rounded-pill bg-brand transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {!isContact && current && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{current.q}</h3>
          {current.hint && <p className="mt-1 text-sm text-text-muted">{current.hint}</p>}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {current.options.map((opt) => {
              const active = chosen.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(current.key, opt, current.multi)}
                  className={`flex items-center justify-between rounded-control border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    active
                      ? "border-brand bg-brand-subtle text-text-primary"
                      : "border-border bg-surface text-text-secondary hover:border-brand/50 hover:text-text-primary"
                  }`}
                >
                  <span>{opt}</span>
                  <span
                    className={`ml-3 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                      active ? "border-brand bg-brand text-bg" : "border-border text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-control border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                Назад
              </button>
            )}
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-control bg-brand px-6 py-2.5 text-sm font-semibold text-bg transition-colors hover:brightness-110 disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {isContact && (
        <form action={action}>
          <h3 className="text-lg font-semibold text-text-primary">Куда прислать подборку?</h3>
          <p className="mt-1 text-sm text-text-muted">Профиль учтём при подборе сделок.</p>

          {/* Резюме ответов */}
          <div className="mt-4 space-y-1.5 rounded-control border border-border bg-surface/60 p-3 text-xs text-text-secondary">
            {STEPS.map((s) => (
              <div key={s.key} className="flex justify-between gap-3">
                <span className="text-text-muted">{s.key}</span>
                <span className="text-right font-medium text-text-primary">{(answers[s.key] ?? []).join(", ") || "—"}</span>
              </div>
            ))}
          </div>

          <input type="hidden" name="message" value={summary} />
          <div className="mt-4 space-y-3">
            <input
              name="name"
              placeholder="Ваше имя"
              required
              className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <input
              name="contact"
              placeholder="Telegram, WhatsApp, телефon или email"
              required
              className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-muted">
              <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
              <span>
                Я согласен(а) на обработку персональных данных в соответствии с{" "}
                <Link href="/privacy" target="_blank" className="text-brand underline">
                  Политикой обработки персональных данных
                </Link>{" "}
                и понимаю, что информация на сайте не является индивидуальной инвестиционной рекомендацией.
              </span>
            </label>
          </div>

          {state.error && <p className="mt-3 text-sm text-negative">{state.error}</p>}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-control border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
            >
              Назад
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-control bg-brand px-6 py-2.5 text-sm font-semibold text-bg transition-colors hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Отправляем…" : "Получить подборку сделок"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
