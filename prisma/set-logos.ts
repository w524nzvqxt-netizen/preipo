// Проставляет логотипы (локальные файлы из открытых источников — Wikimedia Commons)
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const logos: Record<string, string> = {
  Anthropic: "/uploads/logo-anthropic.svg",
  Neuralink: "/uploads/logo-neuralink.svg",
  ClickHouse: "/uploads/logo-clickhouse.svg",
  Polymarket: "/uploads/logo-polymarket.svg",
  Revolut: "/uploads/logo-revolut.svg",
};

async function main() {
  for (const [name, logoUrl] of Object.entries(logos)) {
    const res = await prisma.project.updateMany({
      where: { name },
      data: { logoUrl },
    });
    console.log(`${name}: ${res.count > 0 ? "обновлён" : "не найден"}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
