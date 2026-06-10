// Демо-данные кабинета партнёра (для локальной проверки). Идемпотентно.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }) });

(async () => {
  const agent = await prisma.agent.findUnique({ where: { username: "agent" } });
  if (!agent) throw new Error("нет агента");

  // чистим прежние демо-клиенты
  await prisma.client.deleteMany({ where: { agentId: agent.id, name: "Иван Петров" } });

  const client = await prisma.client.create({
    data: { agentId: agent.id, name: "Иван Петров", contact: "@ivan" },
  });

  // мультипликатор из проекта (оценка выхода ÷ входа)
  const proj = await prisma.project.findFirst({ where: { name: "Cursor" } });
  const mult =
    proj?.valuation && proj?.exitValuation && proj.valuation > 0
      ? proj.exitValuation / proj.valuation
      : 3.5;

  const amount = 100000;
  const grossProfit = amount * Math.max(0, mult - 1);
  const entryFee = Math.round(amount * 0.05 * 100) / 100;
  const sf = Math.round(grossProfit * 0.2 * 100) / 100;
  const partner = Math.round((sf / 4) * 100) / 100;

  await prisma.sale.create({
    data: {
      agentId: agent.id,
      clientId: client.id,
      companyName: "Cursor",
      round: "Series C",
      expMultiple: Math.round(mult * 100) / 100,
      yearsToExit: 3,
      amount,
      entryFee,
      commission: partner,
      sf,
      commissionPaid: false,
    },
  });

  console.log(`DEMO_CLIENT_ID=${client.id}`);
  console.log(`mult=${mult.toFixed(2)} grossProfit=${grossProfit} sf=${sf} partner=${partner} clientNet=${grossProfit - sf}`);
  process.exit(0);
})().catch((e) => {
  console.error("Ошибка:", e instanceof Error ? e.message : e);
  process.exit(1);
});
