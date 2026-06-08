// Добавление/обновление ОДНОЙ сделки (карточки проекта) из JSON-файла.
// Запуск: node prisma/add-deal.cjs path/to/deal.json
// Идемпотентно: если проект с таким name+dealStatus есть — обновляет, иначе создаёт.
//
// Схема JSON (минимум — name; остальное по возможности):
// {
//   "name": "Tamara",
//   "sector": "Финтех / BNPL (Саудовская Аравия)",
//   "stage": "Pre-IPO · закрытый раунд",
//   "dealStatus": "open" | "closed",        // open = открытый раунд, closed = закрытый
//   "description": "…",
//   "salesPoints": ["…","…"] | "строка\nстрока",
//   "pros": ["…"] | "…",
//   "risks": ["…"] | "…",
//   "valuation": 2.8e9,                       // цена входа (entry EV)
//   "exitValuation": 8.4e9,                   // ожидаемая капитализация на IPO
//   "cocMultiple": 2.5,                        // потенциал на капитал (нетто)
//   "expectedReturn": 45,                      // доходность нетто, %/год
//   "expectedExit": "1H 2028 · IPO",
//   "pricePerShare": 1116.67,                  // если есть
//   "volume": 280e6,                           // объём раунда
//   "currency": "USD",
//   "isHot": false,
//   "logoUrl": null,
//   "scenarios": [                              // если не задано — соберётся из cocMultiple
//     {"key":"Худший","color":"amber","mult":1.5,"irr":"~19%"},
//     {"key":"Базовый","color":"sky","mult":2.5,"irr":"~49%"},
//     {"key":"Лучший","color":"emerald","mult":4.1,"irr":"~90%"}
//   ]
// }

const fs = require("fs");
const path = require("path");
const db = require("better-sqlite3")(
  path.resolve(__dirname, "..", "dev.db")
);

function cuid(p) {
  return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function toText(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.filter(Boolean).join("\n");
  return String(v);
}

const file = process.argv[2];
if (!file) {
  console.error("Использование: node prisma/add-deal.cjs path/to/deal.json");
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
if (!d.name) {
  console.error("В JSON нет обязательного поля name");
  process.exit(1);
}

const dealStatus = d.dealStatus === "closed" ? "closed" : "open";

// Сценарии: если не заданы — соберём базовый из cocMultiple; val считаем из mult на $100k
let scenarios = d.scenarios;
if (!scenarios && d.cocMultiple) {
  const b = d.cocMultiple;
  scenarios = [
    { key: "Худший", color: "amber", mult: +(b * 0.5).toFixed(2) },
    { key: "Базовый", color: "sky", mult: b },
    { key: "Лучший", color: "emerald", mult: +(b * 1.9).toFixed(2) },
  ];
}
if (Array.isArray(scenarios)) {
  scenarios = scenarios.map((s) => ({
    key: s.key,
    color: s.color,
    mult: s.mult,
    val: s.val != null ? s.val : Math.round(100000 * (s.mult || 1)),
    irr: s.irr || "—",
  }));
}

const row = {
  name: d.name,
  sector: d.sector ?? null,
  stage: d.stage ?? (dealStatus === "closed" ? "Pre-IPO · закрытый раунд" : "Pre-IPO · открытый раунд"),
  description: d.description ?? null,
  salesPoints: toText(d.salesPoints),
  pros: toText(d.pros),
  risks: toText(d.risks),
  pricePerShare: d.pricePerShare ?? null,
  currency: d.currency ?? "USD",
  volume: d.volume ?? null,
  valuation: d.valuation ?? null,
  exitValuation: d.exitValuation ?? null,
  cocMultiple: d.cocMultiple ?? null,
  expectedExit: d.expectedExit ?? null,
  expectedReturn: d.expectedReturn ?? null,
  scenarios: scenarios ? JSON.stringify(scenarios) : null,
  dealStatus,
  isHot: d.isHot ? 1 : 0,
  isActive: 1,
  logoUrl: d.logoUrl ?? null,
};

const existing = db
  .prepare("SELECT id FROM Project WHERE name=? AND dealStatus=?")
  .get(d.name, dealStatus);

const now = new Date().toISOString();

if (existing) {
  const cols = Object.keys(row).map((k) => `${k}=@${k}`).join(", ");
  db.prepare(`UPDATE Project SET ${cols}, updatedAt=@updatedAt WHERE id=@id`).run({
    ...row,
    updatedAt: now,
    id: existing.id,
  });
  console.log(`✏️  Обновлена сделка: ${d.name} (${dealStatus}) — id ${existing.id}`);
} else {
  const cols = Object.keys(row);
  db.prepare(
    `INSERT INTO Project (id, ${cols.join(",")}, createdAt, updatedAt) VALUES (@id, ${cols
      .map((k) => "@" + k)
      .join(",")}, @createdAt, @updatedAt)`
  ).run({ ...row, id: cuid("dl"), createdAt: now, updatedAt: now });
  console.log(`✅ Добавлена сделка: ${d.name} (${dealStatus})`);
}

const p = db.prepare("SELECT name,dealStatus,valuation,exitValuation,cocMultiple,volume,expectedExit FROM Project WHERE name=? AND dealStatus=?").get(d.name, dealStatus);
console.log("   вход:", p.valuation, "| ожид.кап.IPO:", p.exitValuation, "| ×CoC:", p.cocMultiple, "| объём:", p.volume, "| выход:", p.expectedExit);
