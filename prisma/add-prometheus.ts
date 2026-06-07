// Добавление проекта Project Prometheus
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const description =
  "AI-лаборатория Джеффа Безоса, создающая интеллект для физической экономики. " +
  "Уникальное преимущество — крупнейший в мире производственный датасет: приобретаемые " +
  "промышленные активы становятся источником проприетарных данных для обучения, а технологии " +
  "Prometheus кратно повышают их операционную эффективность. За 5 месяцев собрана команда из " +
  "120+ топ-исследователей (OpenAI, xAI, Google DeepMind, Meta, Anthropic, Nvidia, кванты из " +
  "Citadel и Morgan Stanley) во главе с Vik Bajaj (Co-CEO, ex-глава Google X, со-основатель " +
  "Verily и Grail). Среди советников — Ashish Vaswani и Jakob Uszkoreit, со-авторы «Attention " +
  "Is All You Need». FinSight Ventures инвестирует именно в AI-лабораторию; индустриальный " +
  "холдинг Безоса — отдельная структура и в сделку не входит.";

async function main() {
  const existing = await prisma.project.findFirst({
    where: { name: "Project Prometheus" },
  });
  if (existing) {
    console.log("Project Prometheus уже есть — пропускаю.");
    return;
  }
  await prisma.project.create({
    data: {
      name: "Project Prometheus",
      sector: "AI / Промышленный ИИ",
      stage: "Private round",
      description,
      logoUrl: "/uploads/prometheus.jpg",
      currency: "USD",
      valuation: 46_000_000_000,
      expectedExit: "H2 2029",
      expectedReturn: 51,
      isActive: true,
      isHot: true,
    },
  });
  console.log("Project Prometheus добавлен.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
