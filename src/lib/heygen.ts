// Интеграция с HeyGen: генерация видео с диктором-аватаром на русском.
// Требует HEYGEN_API_KEY и API-кредиты на аккаунте HeyGen.

const API = "https://api.heygen.com";

// Дефолтные аватар и русский голос (можно переопределить в .env)
const AVATAR_ID = process.env.HEYGEN_AVATAR_ID || "Aditya_public_4";
const VOICE_ID =
  process.env.HEYGEN_VOICE_ID || "5f99970adadb42398bf1aeb963a3888b"; // Dmitry (RU)

function key(): string {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error("Не задан HEYGEN_API_KEY в .env");
  return k;
}

// Отправляет видео в генерацию, возвращает video_id
export async function submitAvatarVideo(text: string): Promise<string> {
  const res = await fetch(`${API}/v2/video/generate`, {
    method: "POST",
    headers: { "X-Api-Key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: AVATAR_ID,
            avatar_style: "normal",
          },
          voice: { type: "text", input_text: text, voice_id: VOICE_ID },
        },
      ],
      dimension: { width: 1280, height: 720 },
    }),
  });
  const json = await res.json();
  if (json.error || !json.data?.video_id) {
    throw new Error(
      typeof json.error === "string"
        ? json.error
        : json.error?.message || "HeyGen: не удалось создать видео"
    );
  }
  return json.data.video_id as string;
}

export type HeyGenStatus = {
  status: "processing" | "completed" | "failed" | string;
  url?: string;
  error?: string;
};

// Проверяет статус задачи генерации
export async function getVideoStatus(videoId: string): Promise<HeyGenStatus> {
  const res = await fetch(`${API}/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": key() },
  });
  const json = await res.json();
  const d = json.data ?? {};
  return {
    status: d.status,
    url: d.video_url || undefined,
    error: d.error?.message || d.error?.detail || undefined,
  };
}
