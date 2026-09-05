// Форма создания/редактирования проекта (используется в админке)
import Link from "next/link";
import type { Project } from "@/generated/prisma/client";

export function ProjectForm({
  project,
  action,
}: {
  project?: Project;
  action: (formData: FormData) => void;
}) {
  const input =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500";

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <Field label="Название *">
        <input name="name" required defaultValue={project?.name} className={input} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Отрасль">
          <input
            name="sector"
            defaultValue={project?.sector ?? ""}
            placeholder="Финтех, AI…"
            className={input}
          />
        </Field>
        <Field label="Стадия">
          <input
            name="stage"
            defaultValue={project?.stage ?? ""}
            placeholder="Series C…"
            className={input}
          />
        </Field>
      </div>

      <Field label="Краткое содержание">
        <textarea
          name="description"
          rows={4}
          defaultValue={project?.description ?? ""}
          className={input}
        />
      </Field>

      <Field label="Основные сейлз-поинты (по одному на строку)">
        <textarea
          name="salesPoints"
          rows={4}
          defaultValue={project?.salesPoints ?? ""}
          placeholder={"Лидер рынка в своей нише\nБыстрый рост выручки\nСильные инвесторы"}
          className={input}
        />
      </Field>

      <Field label="Плюсы компании (по одному на строку)">
        <textarea
          name="pros"
          rows={4}
          defaultValue={project?.pros ?? ""}
          placeholder={"Сильная команда\nПроверенная бизнес-модель"}
          className={input}
        />
      </Field>

      <Field label="Риски компании (по одному на строку)">
        <textarea
          name="risks"
          rows={4}
          defaultValue={project?.risks ?? ""}
          placeholder={"Высокая конкуренция\nНеликвидность доли\nIPO не гарантировано"}
          className={input}
        />
      </Field>

      <Field label="Ссылка на логотип">
        <input
          name="logoUrl"
          defaultValue={project?.logoUrl ?? ""}
          placeholder="https://…"
          className={input}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Цена за долю">
          <input
            name="pricePerShare"
            defaultValue={project?.pricePerShare ?? ""}
            placeholder="100"
            className={input}
          />
        </Field>
        <Field label="Валюта">
          <select
            name="currency"
            defaultValue={project?.currency ?? "USD"}
            className={input}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="RUB">RUB (₽)</option>
            <option value="AED">AED</option>
          </select>
        </Field>
        <Field label="Доступный объём">
          <input
            name="volume"
            defaultValue={project?.volume ?? ""}
            placeholder="5000000"
            className={input}
          />
        </Field>
        <Field label="Мин. чек">
          <input
            name="minTicket"
            defaultValue={project?.minTicket ?? ""}
            placeholder="50000"
            className={input}
          />
        </Field>
        <Field label="Оценка компании (вход)">
          <input
            name="valuation"
            defaultValue={project?.valuation ?? ""}
            placeholder="1000000000"
            className={input}
          />
        </Field>
        <Field label="Прогноз выхода">
          <input
            name="expectedExit"
            defaultValue={project?.expectedExit ?? ""}
            placeholder="H2 2029"
            className={input}
          />
        </Field>
        <Field label="Потенциальная доходность, %">
          <input
            name="expectedReturn"
            defaultValue={project?.expectedReturn ?? ""}
            placeholder="51"
            className={input}
          />
        </Field>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={project ? project.isActive : true}
            className="h-4 w-4 accent-emerald-500"
          />
          <span>Показывать на витрине</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isHot"
            defaultChecked={project?.isHot ?? false}
            className="h-4 w-4 accent-amber-500"
          />
          <span>🔥 Горячий</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
        >
          {project ? "Сохранить" : "Создать проект"}
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 hover:bg-neutral-100"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-neutral-400">{label}</span>
      {children}
    </label>
  );
}
