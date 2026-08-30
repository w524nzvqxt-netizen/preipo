// Отдача файла клиента для АДМИНА (видит любые документы всех агентов).
// Защита — админ-сессия. Файлы лежат вне /public.
import { readFile } from "node:fs/promises";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const doc = await prisma.clientDocument.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(doc.filePath);
  } catch {
    return new Response("File missing", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "Content-Length": String(doc.sizeBytes),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
