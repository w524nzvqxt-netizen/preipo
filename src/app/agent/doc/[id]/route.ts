// Защищённая отдача файла клиента: только залогиненному агенту-владельцу.
// Файлы лежат вне /public, поэтому без этой проверки доступа к ним нет.
import { readFile } from "node:fs/promises";
import { getAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await getAgent();
  if (!agent) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const doc = await prisma.clientDocument.findFirst({
    where: { id, agentId: agent.id }, // строго свой документ
  });
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
