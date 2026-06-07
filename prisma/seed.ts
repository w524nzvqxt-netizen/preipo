// Демо-данные для витрины
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const projects = [
  {
    name: "Anthropic",
    sector: "AI",
    stage: "Series F",
    description:
      "Исследовательская компания в области безопасного ИИ, создатель моделей Claude.",
    pricePerShare: 150,
    currency: "USD",
    volume: 8_000_000,
    minTicket: 25_000,
    valuation: 180_000_000_000,
    isActive: true,
    isHot: true,
  },
  {
    name: "Neuralink",
    sector: "Биотех / Нейроинтерфейсы",
    stage: "Series D",
    description: "Разработка вживляемых нейроинтерфейсов мозг-компьютер.",
    pricePerShare: 28,
    currency: "USD",
    volume: 4_500_000,
    minTicket: 50_000,
    valuation: 9_000_000_000,
    isActive: true,
    isHot: true,
  },
  {
    name: "ClickHouse",
    sector: "Data / Аналитика",
    stage: "Series C",
    description: "Колоночная аналитическая СУБД для запросов в реальном времени.",
    pricePerShare: 42,
    currency: "USD",
    volume: 3_000_000,
    minTicket: 25_000,
    valuation: 6_350_000_000,
    isActive: true,
    isHot: false,
  },
  {
    name: "Polymarket",
    sector: "Финтех / Прогнозные рынки",
    stage: "Series B",
    description: "Крупнейшая площадка прогнозных рынков на блокчейне.",
    pricePerShare: 12,
    currency: "USD",
    volume: 2_000_000,
    minTicket: 15_000,
    valuation: 1_000_000_000,
    isActive: true,
    isHot: false,
  },
  {
    name: "Revolut",
    sector: "Финтех / Необанк",
    stage: "Late stage",
    description: "Глобальный необанк с мультивалютными счетами и инвестициями.",
    pricePerShare: 865,
    currency: "USD",
    volume: 6_000_000,
    minTicket: 30_000,
    valuation: 45_000_000_000,
    isActive: true,
    isHot: false,
  },
];

async function main() {
  await prisma.lead.deleteMany();
  await prisma.project.deleteMany();
  for (const p of projects) {
    await prisma.project.create({ data: p });
  }
  console.log(`Создано проектов: ${projects.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
