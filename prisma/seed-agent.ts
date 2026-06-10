// Создание/обновление агента кабинета.
// Запуск: npx tsx prisma/seed-agent.ts <логин> <пароль> "<Имя>"
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { randomBytes, scryptSync } from "node:crypto";

function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${dk}`;
}

const username = (process.argv[2] || "agent").trim().toLowerCase();
const password = process.argv[3] || "agent12345";
const name = process.argv[4] || "Агент";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

(async () => {
  const a = await prisma.agent.upsert({
    where: { username },
    update: { passwordHash: hashPassword(password), name, isActive: true },
    create: { username, name, passwordHash: hashPassword(password) },
  });
  console.log(`Агент готов: логин "${a.username}", имя "${a.name}", id ${a.id}`);
  process.exit(0);
})().catch((e) => {
  console.error("Ошибка:", e instanceof Error ? e.message : e);
  process.exit(1);
});
