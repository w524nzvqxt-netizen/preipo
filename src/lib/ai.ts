// AI-агент-креатор: генерирует профессиональное инвесторское описание проекта
// через Claude API (модель Opus 4.8).
import Anthropic from "@anthropic-ai/sdk";

export type ProjectBrief = {
  founded: string; // Дата/год основания
  idea: string; // Идея проекта
  product: string; // Основной продукт
  team: string; // История и состав команды
  summary: string; // Краткое содержание (2-4 абзаца)
  salesPoints: string[]; // Основные сейлз-поинты
  pros: string[]; // Плюсы компании
  risks: string[]; // Риски компании
};

// JSON-схема структурированного ответа модели
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    founded: { type: "string", description: "Год или дата основания компании" },
    idea: { type: "string", description: "Суть идеи проекта, 1-2 предложения" },
    product: { type: "string", description: "Основной продукт/сервис компании" },
    team: {
      type: "string",
      description: "Краткая история и ключевые лица команды",
    },
    summary: {
      type: "string",
      description:
        "Краткое содержание для инвестора на русском, 2-3 абзаца: что за компания, чем занимается, потенциал",
    },
    salesPoints: {
      type: "array",
      items: { type: "string" },
      description: "3-5 ключевых сейлз-поинтов (почему это привлекательная сделка)",
    },
    pros: {
      type: "array",
      items: { type: "string" },
      description: "3-5 сильных сторон компании",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "3-5 ключевых рисков инвестиции в эту компанию",
    },
  },
  required: ["founded", "idea", "product", "team", "summary", "salesPoints", "pros", "risks"],
} as const;

export async function generateProjectBrief(
  name: string,
  hints?: { sector?: string | null; stage?: string | null }
): Promise<ProjectBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Не задан ANTHROPIC_API_KEY в .env");
  }

  const client = new Anthropic({ apiKey });

  const context = [
    hints?.sector ? `Отрасль: ${hints.sector}.` : "",
    hints?.stage ? `Стадия: ${hints.stage}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system:
      "Ты — аналитик pre-IPO сделок. Пишешь профессиональные инвесторские описания частных компаний на русском языке: ёмко, по делу, в деловом тоне. " +
      "Опирайся на публично известную информацию о компании. Если точных данных нет — формулируй обобщённо и не выдумывай конкретные цифры. " +
      "Не давай инвестиционных рекомендаций и гарантий доходности.",
    messages: [
      {
        role: "user",
        content:
          `Подготовь инвесторское описание для pre-IPO проекта «${name}». ${context}\n\n` +
          "Раскрой: дату основания, идею, основной продукт, историю и команду, и дай цельное описание (summary) для карточки на витрине.",
      },
    ],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });

  // Извлекаем текст ответа и парсим JSON
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return JSON.parse(text) as ProjectBrief;
}

// AI-сценарист: готовит сценарий короткого видео о проекте для сайта.
export type VideoScene = { caption: string; narration: string };

const VIDEO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scenes: {
      type: "array",
      description: "5-6 сцен короткого промо-видео о проекте (~40 секунд)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          caption: {
            type: "string",
            description: "Короткий титр на экране (до 7 слов)",
          },
          narration: {
            type: "string",
            description: "Закадровый текст сцены, 1-2 предложения",
          },
        },
        required: ["caption", "narration"],
      },
    },
  },
  required: ["scenes"],
} as const;

export async function generateVideoScenes(
  name: string,
  context: string
): Promise<VideoScene[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Не задан ANTHROPIC_API_KEY в .env");
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    system:
      "Ты — сценарист коротких промо-видео о pre-IPO проектах для инвесторов. " +
      "Пишешь динамичный, ёмкий сценарий на русском: цепляющий хук, что за компания, ключевые сейлз-поинты, оценка и прогноз выхода, призыв к действию. " +
      "Деловой тон, без воды и гарантий доходности. Опирайся на переданный контекст о проекте, не выдумывай конкретные цифры сверх него.",
    messages: [
      {
        role: "user",
        content: `Проект «${name}». Контекст:\n${context}\n\nПодготовь сценарий промо-видео (5-6 сцен).`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: VIDEO_SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = JSON.parse(text) as { scenes: VideoScene[] };
  return parsed.scenes;
}

// AI-аналитик: оценивает финансовую отчётность и план компании по документам.
export type FinancialAnalysis = {
  summary: string; // Общая оценка
  financialHealth: string; // Финансовое состояние
  keyMetrics: string[]; // Ключевые показатели
  planAssessment: string; // Оценка бизнес-плана/стратегии
  strengths: string[]; // Сильные стороны
  concerns: string[]; // Риски / слабые места
  verdict: string; // Итоговый вывод
};

const FIN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "Краткая общая оценка фин. отчётности и плана" },
    financialHealth: { type: "string", description: "Оценка финансового состояния компании" },
    keyMetrics: {
      type: "array",
      items: { type: "string" },
      description: "Ключевые финансовые показатели из документов (выручка, рост, оценка, burn и т.п.)",
    },
    planAssessment: { type: "string", description: "Оценка бизнес-плана и стратегии" },
    strengths: { type: "array", items: { type: "string" }, description: "Сильные стороны (3-5)" },
    concerns: { type: "array", items: { type: "string" }, description: "Риски и слабые места (3-5)" },
    verdict: { type: "string", description: "Итоговый вывод аналитика" },
  },
  required: ["summary", "financialHealth", "keyMetrics", "planAssessment", "strengths", "concerns", "verdict"],
} as const;

export async function analyzeFinancials(
  name: string,
  pdfs: { filename: string; base64: string }[]
): Promise<FinancialAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Не задан ANTHROPIC_API_KEY в .env");
  if (pdfs.length === 0) throw new Error("Нет PDF-документов для анализа");
  const client = new Anthropic({ apiKey });

  const content: Anthropic.ContentBlockParam[] = pdfs.map((p) => ({
    type: "document",
    source: { type: "base64", media_type: "application/pdf", data: p.base64 },
    title: p.filename,
  }));
  content.push({
    type: "text",
    text:
      `Это инвестиционные материалы компании «${name}». ` +
      "Оцени финансовую отчётность и бизнес-план как инвестиционный аналитик: финансовое состояние, ключевые показатели, " +
      "качество плана и стратегии, сильные стороны, риски и итоговый вывод. Опирайся только на данные из документов, не выдумывай цифры. " +
      "Без инвестиционных рекомендаций и гарантий.",
  });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content }],
    output_config: { format: { type: "json_schema", schema: FIN_SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as FinancialAnalysis;
}

// AI-агент: изучает фин. отчётность и планы и готовит презентацию компании.
export type DeckSlide = { title: string; bullets: string[] };
export type CompanyDeck = { subtitle: string; slides: DeckSlide[] };

const DECK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subtitle: { type: "string", description: "Подзаголовок титульного слайда" },
    slides: {
      type: "array",
      description:
        "10-12 слайдов презентации компании для инвестора: о компании, рынок, продукт, финансы (цифры из документов), план/стратегия, оценка и прогноз выхода, сильные стороны, риски, итог",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "Заголовок слайда" },
          bullets: {
            type: "array",
            items: { type: "string" },
            description: "3-6 ёмких тезисов слайда",
          },
        },
        required: ["title", "bullets"],
      },
    },
  },
  required: ["subtitle", "slides"],
} as const;

export async function generateCompanyDeck(
  name: string,
  pdfs: { filename: string; base64: string }[]
): Promise<CompanyDeck> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Не задан ANTHROPIC_API_KEY в .env");
  if (pdfs.length === 0) throw new Error("Нет PDF-документов для анализа");
  const client = new Anthropic({ apiKey });

  const content: Anthropic.ContentBlockParam[] = pdfs.map((p) => ({
    type: "document",
    source: { type: "base64", media_type: "application/pdf", data: p.base64 },
    title: p.filename,
  }));
  content.push({
    type: "text",
    text:
      `Это инвестиционные материалы компании «${name}» (фин. отчётность и планы). ` +
      "Изучи их и подготовь структуру профессиональной инвесторской презентации компании на русском: " +
      "10-12 слайдов с ёмкими тезисами, обязательно с финансовыми показателями и оценкой плана из документов. " +
      "Опирайся только на данные из документов, не выдумывай цифры. Без гарантий доходности.",
  });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content }],
    output_config: { format: { type: "json_schema", schema: DECK_SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as CompanyDeck;
}

// AI-агент-редактор: переписывает текст так, чтобы он был максимально
// презентабельным для инвестора — чисто, убедительно, в деловом тоне.
export async function polishText(
  name: string,
  current: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Не задан ANTHROPIC_API_KEY в .env");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    system:
      "Ты — редактор инвестиционных материалов. Переписываешь описания pre-IPO проектов так, чтобы они звучали " +
      "максимально презентабельно и убедительно для инвестора: чёткая структура, деловой тон, сильные формулировки, " +
      "без воды и канцелярита. Сохраняй все факты из исходного текста — ничего не выдумывай и не добавляй новых цифр. " +
      "Пиши на русском, 2–4 связных абзаца. Не давай инвестиционных рекомендаций и гарантий доходности. " +
      "В ответе верни ТОЛЬКО готовый текст описания, без заголовков и пояснений.",
    messages: [
      {
        role: "user",
        content: `Проект: «${name}».\n\nИсходный текст:\n${current}\n\nПерепиши его в максимально презентабельном виде.`,
      },
    ],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
