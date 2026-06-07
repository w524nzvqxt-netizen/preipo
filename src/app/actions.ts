"use server";

// Серверное действие: посетитель оставляет заявку -> лид падает в базу
import { prisma } from "@/lib/prisma";

export type LeadState = {
  ok?: boolean;
  error?: string;
};

export async function submitLead(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const projectId = String(formData.get("projectId") || "").trim() || null;

  if (!name || !contact) {
    return { error: "Укажите имя и контакт для связи." };
  }

  try {
    await prisma.lead.create({
      data: {
        name,
        contact,
        message: message || null,
        projectId,
      },
    });
    return { ok: true };
  } catch {
    return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}
