// Редактирование проекта + управление документами
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/ProjectForm";
import { AiDescriptionButton } from "@/components/AiDescriptionButton";
import { formatSize } from "@/lib/format";
import {
  updateProject,
  uploadDocument,
  deleteDocument,
  generateDescription,
  polishDescription,
  generateVideoScript,
  generateAvatarVideo,
  refreshAvatarVideo,
} from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: "asc" } } },
  });
  if (!project) notFound();

  // Привязываем id к серверным действиям
  const update = updateProject.bind(null, id);
  const upload = uploadDocument.bind(null, id);
  const generate = generateDescription.bind(null, id);
  const polish = polishDescription.bind(null, id);
  const videoScript = generateVideoScript.bind(null, id);
  const avatarVideo = generateAvatarVideo.bind(null, id);
  const refreshVideo = refreshAvatarVideo.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Редактирование: {project.name}</h1>
      <div className="max-w-2xl rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-3 text-sm font-medium text-neutral-700">
          AI-помощники для описания
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <AiDescriptionButton
            action={generate}
            label="✨ Сгенерировать описание"
            pendingLabel="✨ Генерирую…"
            note=""
          />
          <AiDescriptionButton
            action={polish}
            label="🪄 Сделать презентабельнее"
            pendingLabel="🪄 Редактирую…"
            note=""
          />
          <AiDescriptionButton
            action={videoScript}
            label="🎬 Сгенерировать видео-сценарий"
            pendingLabel="🎬 Пишу сценарий…"
            note=""
          />
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          AI-текст может содержать неточности — проверьте факты перед публикацией.
        </p>

        {/* Видео с диктором HeyGen */}
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">
            Видео с диктором (HeyGen){" "}
            {project.videoStatus && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                  project.videoStatus === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : project.videoStatus === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {project.videoStatus === "completed"
                  ? "готово"
                  : project.videoStatus === "failed"
                    ? "ошибка"
                    : "обрабатывается"}
              </span>
            )}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <AiDescriptionButton
              action={avatarVideo}
              label="🎥 Сгенерировать видео с диктором"
              pendingLabel="🎥 Запускаю…"
              note=""
            />
            {project.videoJobId && project.videoStatus !== "completed" && (
              <AiDescriptionButton
                action={refreshVideo}
                label="🔄 Проверить статус / скачать"
                pendingLabel="🔄 Проверяю…"
                note=""
              />
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Нужны API-кредиты HeyGen. Генерация занимает несколько минут — затем
            нажмите «Проверить статус».
          </p>
        </div>
      </div>
      <div className="mt-6">
        {/* key по updatedAt — форма пересоздаётся после AI-генерации, чтобы подтянуть новое описание */}
        <ProjectForm
          key={project.updatedAt.getTime()}
          project={project}
          action={update}
        />
      </div>

      {/* Документы */}
      <div className="mt-12 max-w-2xl border-t border-neutral-200 pt-8">
        <h2 className="text-xl font-bold">Документы и презентации</h2>
        <p className="mt-1 text-sm text-neutral-500">
          PDF и другие файлы — посетители смогут скачать их на странице проекта.
        </p>

        {project.documents.length > 0 && (
          <div className="mt-5 space-y-2">
            {project.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
              >
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-emerald-600"
                >
                  <span className="text-neutral-400">📄</span>
                  <span>
                    <span className="font-medium">{doc.title}</span>
                    <span className="block text-xs text-neutral-500">
                      {doc.fileName} · {formatSize(doc.sizeBytes)}
                    </span>
                  </span>
                </a>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <button className="text-sm text-neutral-400 hover:text-red-500">
                    Удалить
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Форма загрузки */}
        <form
          action={upload}
          className="mt-5 space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <input
            name="title"
            placeholder="Название документа (напр. «Презентация»)"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500"
          />
          <select
            name="kind"
            defaultValue="doc"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="doc">Тип: документ</option>
            <option value="financial">Тип: финансовая модель</option>
            <option value="presentation">Тип: презентация</option>
          </select>
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-neutral-700 hover:file:bg-neutral-200"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            Загрузить документ
          </button>
        </form>
      </div>
    </div>
  );
}
