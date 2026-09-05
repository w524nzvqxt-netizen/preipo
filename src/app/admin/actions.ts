"use server";

// Серверные действия админки: логин, CRUD проектов, статусы заявок, документы
import { writeFile, unlink, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  generateProjectBrief,
  polishText,
  generateVideoScenes,
  analyzeFinancials,
} from "@/lib/ai";
import { submitAvatarVideo, getVideoStatus } from "@/lib/heygen";
import {
  checkPassword,
  setSession,
  clearSession,
  isAuthed,
} from "@/lib/auth";

// --- Аутентификация ---

export type LoginState = { error?: string };

// Защита от перебора: лимит неудачных попыток по IP (in-memory).
const MAX_FAILS = 6;
const LOCK_MS = 10 * 60 * 1000; // блок на 10 минут
const fails = new Map<string, { n: number; until: number }>();

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await clientIp();
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && rec.until > now) {
    return { error: "Слишком много попыток. Попробуйте через несколько минут." };
  }

  const password = String(formData.get("password") || "");
  if (!checkPassword(password)) {
    const n = (rec?.n ?? 0) + 1;
    fails.set(ip, { n, until: n >= MAX_FAILS ? now + LOCK_MS : 0 });
    // небольшая задержка тормозит автоматический перебор
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Неверный пароль." };
  }

  fails.delete(ip);
  await setSession();
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}

// Защита: каждое мутирующее действие проверяет сессию
async function requireAuth() {
  if (!(await isAuthed())) redirect("/admin/login");
}

// --- Парсинг полей формы проекта ---

function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "").trim().replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) || "").trim();
  return v || null;
}

function projectData(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    sector: str(formData, "sector"),
    stage: str(formData, "stage"),
    description: str(formData, "description"),
    salesPoints: str(formData, "salesPoints"),
    pros: str(formData, "pros"),
    risks: str(formData, "risks"),
    logoUrl: str(formData, "logoUrl"),
    pricePerShare: num(formData, "pricePerShare"),
    currency: String(formData.get("currency") || "USD"),
    volume: num(formData, "volume"),
    minTicket: num(formData, "minTicket"),
    valuation: num(formData, "valuation"),
    expectedExit: str(formData, "expectedExit"),
    expectedReturn: num(formData, "expectedReturn"),
    isActive: formData.get("isActive") === "on",
    isHot: formData.get("isHot") === "on",
  };
}

// --- CRUD проектов ---

export async function createProject(formData: FormData) {
  await requireAuth();
  const data = projectData(formData);
  if (!data.name) return;
  await prisma.project.create({ data });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateProject(id: string, formData: FormData) {
  await requireAuth();
  const data = projectData(formData);
  if (!data.name) return;
  await prisma.project.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteProject(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "");
  // Файлы документов проекта — удаляем с диска (в БД уйдут каскадом)
  const docs = await prisma.projectDocument.findMany({
    where: { projectId: id },
    select: { fileUrl: true },
  });
  for (const d of docs) {
    try {
      await unlink(path.join(process.cwd(), "public", d.fileUrl));
    } catch {}
  }
  await prisma.lead.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function toggleActive(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "");
  const project = await prisma.project.findUnique({ where: { id } });
  if (project) {
    await prisma.project.update({
      where: { id },
      data: { isActive: !project.isActive },
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

// --- AI-генерация описания проекта ---

export type AiState = { ok?: boolean; error?: string };

export async function generateDescription(
  projectId: string,
  _prev: AiState,
  _formData: FormData
): Promise<AiState> {
  await requireAuth();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Проект не найден." };

  try {
    const brief = await generateProjectBrief(project.name, {
      sector: project.sector,
      stage: project.stage,
    });
    // Краткое содержание = summary + ключевые факты
    const description =
      `${brief.summary}\n\n` +
      `Основание: ${brief.founded}. Продукт: ${brief.product}. Команда: ${brief.team}`;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        description,
        salesPoints: brief.salesPoints.join("\n"),
        pros: brief.pros.join("\n"),
        risks: brief.risks.join("\n"),
      },
    });
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/project/${projectId}`);
    return { ok: true };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось сгенерировать описание.",
    };
  }
}

// AI-редактор: делает существующее описание максимально презентабельным
export async function polishDescription(
  projectId: string,
  _prev: AiState,
  _formData: FormData
): Promise<AiState> {
  await requireAuth();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "Проект не найден." };
  if (!project.description?.trim()) {
    return { error: "Сначала добавьте или сгенерируйте описание." };
  }

  try {
    const polished = await polishText(project.name, project.description);
    await prisma.project.update({
      where: { id: projectId },
      data: { description: polished },
    });
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/project/${projectId}`);
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось улучшить текст.",
    };
  }
}

// AI-сценарист: готовит сценарий видео о проекте
export async function generateVideoScript(
  projectId: string,
  _prev: AiState,
  _formData: FormData
): Promise<AiState> {
  await requireAuth();
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) return { error: "Проект не найден." };

  const context = [
    p.description && `Описание: ${p.description}`,
    p.salesPoints && `Сейлз-поинты: ${p.salesPoints}`,
    p.pros && `Плюсы: ${p.pros}`,
    p.valuation && `Оценка: ${p.valuation} ${p.currency}`,
    p.expectedExit && `Прогноз выхода: ${p.expectedExit}`,
    p.expectedReturn != null && `Доходность: +${p.expectedReturn}%`,
    p.sector && `Отрасль: ${p.sector}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const scenes = await generateVideoScenes(p.name, context || p.name);
    await prisma.project.update({
      where: { id: projectId },
      data: { videoScript: JSON.stringify(scenes) },
    });
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/project/${projectId}`);
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось сгенерировать сценарий.",
    };
  }
}

// AI-аналитик: оценивает фин. отчётность и план по PDF-документам проекта
export async function analyzeFinancialsAction(
  projectId: string,
  _prev: AiState,
  _formData: FormData
): Promise<AiState> {
  await requireAuth();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { documents: true },
  });
  if (!project) return { error: "Проект не найден." };

  // Берём PDF-документы (финмодель-xlsx Claude не читает)
  const pdfDocs = project.documents.filter((d) =>
    d.fileUrl.toLowerCase().endsWith(".pdf")
  );
  if (pdfDocs.length === 0) {
    return { error: "Нет PDF-документов. Загрузите меморандум/питч в формате PDF." };
  }

  try {
    const pdfs = await Promise.all(
      pdfDocs.slice(0, 4).map(async (d) => {
        const buf = await readFile(
          path.join(process.cwd(), "public", d.fileUrl)
        );
        return { filename: d.title, base64: buf.toString("base64") };
      })
    );
    const analysis = await analyzeFinancials(project.name, pdfs);
    await prisma.project.update({
      where: { id: projectId },
      data: { financialAnalysis: JSON.stringify(analysis) },
    });
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/project/${projectId}`);
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось проанализировать.",
    };
  }
}

// --- Видео с диктором (HeyGen) ---

// Собирает текст для диктора из сценария видео или описания
function narrationText(p: {
  name: string;
  videoScript: string | null;
  description: string | null;
}): string {
  if (p.videoScript) {
    try {
      const scenes = JSON.parse(p.videoScript) as { narration: string }[];
      const joined = scenes.map((s) => s.narration).join(" ");
      if (joined.trim()) return joined;
    } catch {}
  }
  return p.description?.trim() || `Презентация проекта ${p.name}.`;
}

export async function generateAvatarVideo(
  projectId: string,
  _prev: AiState,
  _formData: FormData
): Promise<AiState> {
  await requireAuth();
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) return { error: "Проект не найден." };
  try {
    const text = narrationText(p).slice(0, 1500); // ограничим длину
    const videoId = await submitAvatarVideo(text);
    await prisma.project.update({
      where: { id: projectId },
      data: { videoJobId: videoId, videoStatus: "processing", videoUrl: null },
    });
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось запустить генерацию.",
    };
  }
}

export async function refreshAvatarVideo(
  projectId: string,
  _prev: AiState,
  _formData: FormData
): Promise<AiState> {
  await requireAuth();
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p?.videoJobId) return { error: "Видео ещё не запускалось." };

  try {
    const st = await getVideoStatus(p.videoJobId);
    if (st.status === "completed" && st.url) {
      // Скачиваем готовый mp4 в /public
      const res = await fetch(st.url);
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(UPLOAD_DIR, { recursive: true });
      const file = `heygen-${projectId}.mp4`;
      await writeFile(path.join(UPLOAD_DIR, file), buf);
      await prisma.project.update({
        where: { id: projectId },
        data: { videoStatus: "completed", videoUrl: `/uploads/${file}` },
      });
      revalidatePath(`/admin/projects/${projectId}`);
      revalidatePath(`/project/${projectId}`);
      return { ok: true };
    }
    if (st.status === "failed") {
      await prisma.project.update({
        where: { id: projectId },
        data: { videoStatus: "failed", videoUrl: st.error || "ошибка" },
      });
      return { error: `HeyGen: ${st.error || "генерация не удалась"}` };
    }
    return { error: "Ещё обрабатывается — попробуйте через минуту." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось проверить статус.",
    };
  }
}

// --- Документы проекта (PDF, презентации) ---

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function uploadDocument(projectId: string, formData: FormData) {
  await requireAuth();
  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") || "").trim();
  const kind = String(formData.get("kind") || "doc");
  if (!file || file.size === 0) return;

  // Безопасное имя файла: cuid-подобный префикс + исходное расширение
  const ext = path.extname(file.name) || "";
  const safe = `${Date.now()}-${Math.round(file.size)}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, safe), buffer);

  await prisma.projectDocument.create({
    data: {
      projectId,
      title: title || file.name,
      kind,
      fileUrl: `/uploads/${safe}`,
      fileName: file.name,
      sizeBytes: file.size,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/project/${projectId}`);
}

export async function deleteDocument(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "");
  const doc = await prisma.projectDocument.findUnique({ where: { id } });
  if (!doc) return;

  // Пытаемся удалить файл с диска (не падаем, если его уже нет)
  try {
    await unlink(path.join(process.cwd(), "public", doc.fileUrl));
  } catch {}

  await prisma.projectDocument.delete({ where: { id } });
  revalidatePath(`/admin/projects/${doc.projectId}`);
  revalidatePath(`/project/${doc.projectId}`);
}

// --- Котировки (бегущая строка) ---

function quoteData(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    valuation: String(formData.get("valuation") || "").trim(),
    change: String(formData.get("change") || "").trim(),
    up: formData.get("up") === "on",
    order: Number(formData.get("order") || 0) || 0,
    isActive: formData.get("isActive") === "on",
  };
}

export async function createQuote(formData: FormData) {
  await requireAuth();
  const d = quoteData(formData);
  if (!d.name) return;
  await prisma.quote.create({ data: d });
  revalidatePath("/");
  revalidatePath("/admin/quotes");
}

export async function updateQuote(id: string, formData: FormData) {
  await requireAuth();
  const d = quoteData(formData);
  if (!d.name) return;
  await prisma.quote.update({ where: { id }, data: d });
  revalidatePath("/");
  revalidatePath("/admin/quotes");
}

export async function deleteQuote(formData: FormData) {
  await requireAuth();
  await prisma.quote.delete({ where: { id: String(formData.get("id") || "") } });
  revalidatePath("/");
  revalidatePath("/admin/quotes");
}

// --- Заявки ---

export async function setLeadStatus(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin/leads");
}

export async function deleteLead(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "");
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/admin/leads");
}
