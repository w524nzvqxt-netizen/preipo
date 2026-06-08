// Сидинг публичных компаний (уже вышедших на IPO) для раздела трек-рекорда рынка.
// Данные собраны командой агентов-исследователей с перепроверкой по источникам (июнь 2026).
const db = require("better-sqlite3")("C:/Users/user/Desktop/preipo-platform/dev.db");

function cuid(p) {
  return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const data = [
  { name: "Astera Labs", ticker: "ALAB", sector: "AI-полупроводники", ipoDate: "2024-03", ipoPriceUSD: 36, ipoValuationUSD: 5.5e9, currentPriceUSD: 317.06, currentMarketCapUSD: 54.32e9, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2021, valuationUSD: 0.95e9, note: "$50M, Fidelity/Intel Capital" },
      { round: "Series D", year: 2022, valuationUSD: 3.1e9, note: "$150M, лид Fidelity" },
    ] },
  { name: "Arm Holdings", ticker: "ARM", sector: "Полупроводники / IP", ipoDate: "2023-09", ipoPriceUSD: 51, ipoValuationUSD: 54.5e9, currentPriceUSD: 342.93, currentMarketCapUSD: 366.27e9, asOf: "2026-06",
    rounds: [
      { round: "Покупка SoftBank", year: 2016, valuationUSD: 32e9, note: "SoftBank купил Arm за ~$32B" },
      { round: "Сделка Nvidia (сорвалась)", year: 2022, valuationUSD: 40e9, note: "$40B, заблокирована регуляторами" },
    ] },
  { name: "Reddit", ticker: "RDDT", sector: "Соцсети / медиа", ipoDate: "2024-03", ipoPriceUSD: 34, ipoValuationUSD: 6.4e9, currentPriceUSD: 173.45, currentMarketCapUSD: 33.39e9, asOf: "2026-06",
    rounds: [
      { round: "Series B", year: 2014, valuationUSD: 0.5e9, note: "$50M, Sam Altman/a16z/Sequoia" },
      { round: "Series C", year: 2017, valuationUSD: 1.8e9, note: "$200M" },
      { round: "Series D", year: 2019, valuationUSD: 3e9, note: "$300M, лид Tencent" },
      { round: "Series E", year: 2021, valuationUSD: 6.4e9, note: "$368M, лид Vy Capital" },
      { round: "Series F", year: 2021, valuationUSD: 10e9, note: "лид Fidelity, пик частной оценки" },
    ] },
  { name: "Circle", ticker: "CRCL", sector: "Финтех / Стейблкоины", ipoDate: "2025-06", ipoPriceUSD: 31, ipoValuationUSD: 6.9e9, currentPriceUSD: 80.27, currentMarketCapUSD: 19.95e9, asOf: "2026-06",
    rounds: [
      { round: "Series E", year: 2018, valuationUSD: 3e9, note: "$110M, лид Bitmain; старт USDC" },
      { round: "SPAC (не состоялся)", year: 2022, valuationUSD: 9e9, note: "$9B, сделка отменена" },
    ] },
  { name: "CoreWeave", ticker: "CRWV", sector: "AI-облако / инфраструктура", ipoDate: "2025-03", ipoPriceUSD: 40, ipoValuationUSD: 23e9, currentPriceUSD: 102.91, currentMarketCapUSD: 54.77e9, asOf: "2026-06",
    rounds: [
      { round: "Series B", year: 2023, valuationUSD: 2.2e9, note: "$221M, Magnetar + Nvidia" },
      { round: "Secondary", year: 2023, valuationUSD: 7e9, note: "рост ×3 за 5 месяцев" },
      { round: "Series C", year: 2024, valuationUSD: 19e9, note: "$1.1B, лид Coatue" },
      { round: "Secondary", year: 2024, valuationUSD: 23e9, note: "$650M, оценка $23B" },
    ] },
  { name: "Rubrik", ticker: "RBRK", sector: "Кибербезопасность / данные", ipoDate: "2024-04", ipoPriceUSD: 32, ipoValuationUSD: 5.6e9, currentPriceUSD: 73.41, currentMarketCapUSD: 15.1e9, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2017, valuationUSD: 1.3e9, note: "$180M, лид IVP" },
      { round: "Series E", year: 2019, valuationUSD: 3.3e9, note: "$261M, Bain/Lightspeed" },
      { round: "Series F", year: 2021, valuationUSD: 4e9, note: "инвестор Microsoft" },
    ] },
  { name: "Robinhood", ticker: "HOOD", sector: "Финтех / Брокер", ipoDate: "2021-07", ipoPriceUSD: 38, ipoValuationUSD: 32e9, currentPriceUSD: 81.38, currentMarketCapUSD: 74.33e9, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2017, valuationUSD: 1.3e9, note: "$110M" },
      { round: "Series E", year: 2019, valuationUSD: 7.6e9, note: "$323M, лид DST" },
      { round: "Series G", year: 2020, valuationUSD: 11.7e9, note: "лид D1 Capital, перед IPO" },
    ] },
  { name: "Hinge Health", ticker: "HNGE", sector: "Цифровое здоровье", ipoDate: "2025-05", ipoPriceUSD: 32, ipoValuationUSD: 2.6e9, currentPriceUSD: 63.48, currentMarketCapUSD: 4.91e9, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2020, valuationUSD: 0.436e9, note: "$91.5M" },
      { round: "Series D", year: 2021, valuationUSD: 3e9, note: "$300M, Tiger/Coatue" },
      { round: "Series E", year: 2021, valuationUSD: 6.2e9, note: "$400M, пик $6.2B" },
    ] },
  { name: "Instacart", ticker: "CART", sector: "Доставка продуктов", ipoDate: "2023-09", ipoPriceUSD: 30, ipoValuationUSD: 9.9e9, currentPriceUSD: 41.26, currentMarketCapUSD: 9.7e9, asOf: "2026-06",
    rounds: [
      { round: "Series F", year: 2018, valuationUSD: 7.6e9, note: "$600M" },
      { round: "Venture", year: 2020, valuationUSD: 17.7e9, note: "ковидный рост" },
      { round: "Venture (пик)", year: 2021, valuationUSD: 39e9, note: "$265M, пик $39B" },
      { round: "Переоценка 409A", year: 2022, valuationUSD: 13e9, note: "снижение к концу 2022" },
    ] },
  { name: "Nu Holdings (Nubank)", ticker: "NU", sector: "Финтех / Необанк", ipoDate: "2021-12", ipoPriceUSD: 9, ipoValuationUSD: 41.4e9, currentPriceUSD: 11.97, currentMarketCapUSD: 58.19e9, asOf: "2026-06",
    rounds: [
      { round: "Series E", year: 2018, valuationUSD: 4e9, note: "$180M от Tencent" },
      { round: "Series F", year: 2019, valuationUSD: 10e9, note: "$400M, лид TCV" },
      { round: "Series G", year: 2021, valuationUSD: 30e9, note: "Berkshire Hathaway, перед IPO" },
    ] },
  { name: "Tempus AI", ticker: "TEM", sector: "ИИ / Медицина", ipoDate: "2024-06", ipoPriceUSD: 37, ipoValuationUSD: 6.1e9, currentPriceUSD: 46.43, currentMarketCapUSD: 8.34e9, asOf: "2026-06",
    rounds: [
      { round: "Series G-1", year: 2020, valuationUSD: 5e9, note: "$100M" },
      { round: "Series G-2", year: 2020, valuationUSD: 8.1e9, note: "$200M, Google и др." },
      { round: "Series H", year: 2022, valuationUSD: 10.25e9, note: "пик ~$10.25B" },
    ] },
  { name: "ServiceTitan", ticker: "TTAN", sector: "Софт / Вертикальный SaaS", ipoDate: "2024-12", ipoPriceUSD: 71, ipoValuationUSD: 6.3e9, currentPriceUSD: 77.4, currentMarketCapUSD: 7.38e9, asOf: "2026-06",
    rounds: [
      { round: "Series F", year: 2021, valuationUSD: 8.3e9, note: "$500M, Tiger/Sequoia" },
      { round: "Series G", year: 2021, valuationUSD: 9.5e9, note: "Thoma Bravo, пик" },
      { round: "Series H", year: 2022, valuationUSD: 7.37e9, note: "down-round перед IPO" },
    ] },
  { name: "Coinbase", ticker: "COIN", sector: "Финтех / Крипто-биржа", ipoDate: "2021-04", ipoPriceUSD: 250, ipoValuationUSD: 65.3e9, currentPriceUSD: 152.4, currentMarketCapUSD: 40.15e9, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2017, valuationUSD: 1.6e9, note: "$100M" },
      { round: "Series E", year: 2018, valuationUSD: 8e9, note: "$300M" },
    ] },
  { name: "Chime", ticker: "CHYM", sector: "Финтех / Необанк", ipoDate: "2025-06", ipoPriceUSD: 27, ipoValuationUSD: 11.6e9, currentPriceUSD: 18.08, currentMarketCapUSD: 6.92e9, asOf: "2026-06",
    rounds: [
      { round: "Series E", year: 2019, valuationUSD: 5.8e9, note: "$500M" },
      { round: "Series F", year: 2020, valuationUSD: 14.5e9, note: "$485M" },
      { round: "Series G", year: 2021, valuationUSD: 25e9, note: "пик $25B, SoftBank" },
    ] },
  { name: "Figma", ticker: "FIG", sector: "Софт / Дизайн-инструменты", ipoDate: "2025-07", ipoPriceUSD: 33, ipoValuationUSD: 18.8e9, currentPriceUSD: 21.46, currentMarketCapUSD: 11.89e9, asOf: "2026-06",
    rounds: [
      { round: "Series E", year: 2021, valuationUSD: 10e9, note: "$200M, Sequoia/a16z" },
      { round: "Adobe (сорвалась)", year: 2022, valuationUSD: 20e9, note: "$20B, отменена 2023" },
      { round: "Tender offer", year: 2024, valuationUSD: 12.5e9, note: "вторичный, ликвидность" },
    ] },
  { name: "Coinbase placeholder", ticker: "SKIP", sector: null, ipoDate: null, ipoPriceUSD: null, ipoValuationUSD: null, currentPriceUSD: null, currentMarketCapUSD: null, asOf: null, rounds: [] },
  { name: "Klaviyo", ticker: "KVYO", sector: "Софт / Маркетинг", ipoDate: "2023-09", ipoPriceUSD: 30, ipoValuationUSD: 9.2e9, currentPriceUSD: 15.58, currentMarketCapUSD: 4.66e9, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2020, valuationUSD: 4.15e9, note: "$200M, Accel" },
      { round: "Series D", year: 2021, valuationUSD: 9.5e9, note: "$320M, пик частной оценки" },
    ] },
  { name: "Klarna", ticker: "KLAR", sector: "Финтех / BNPL", ipoDate: "2025-09", ipoPriceUSD: 40, ipoValuationUSD: 15.1e9, currentPriceUSD: 16.36, currentMarketCapUSD: 6.19e9, asOf: "2026-06",
    rounds: [
      { round: "Раунд 2020", year: 2020, valuationUSD: 10.65e9, note: "Silver Lake" },
      { round: "Раунд (пик)", year: 2021, valuationUSD: 45.6e9, note: "пик $45.6B, SoftBank" },
      { round: "Down-round", year: 2022, valuationUSD: 6.7e9, note: "−85% от пика" },
      { round: "Pre-IPO", year: 2025, valuationUSD: 15e9, note: "перед IPO" },
    ] },
  { name: "Ibotta", ticker: "IBTA", sector: "Реклама / Кэшбэк", ipoDate: "2024-04", ipoPriceUSD: 88, ipoValuationUSD: 2.67e9, currentPriceUSD: 32.85, currentMarketCapUSD: 0.765e9, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2019, valuationUSD: 1e9, note: "Koch Disruptive, статус единорога" },
    ] },
  { name: "Rivian", ticker: "RIVN", sector: "Электромобили", ipoDate: "2021-11", ipoPriceUSD: 78, ipoValuationUSD: 66.5e9, currentPriceUSD: 16.54, currentMarketCapUSD: 20.93e9, asOf: "2026-06",
    rounds: [
      { round: "Series C (Amazon)", year: 2019, valuationUSD: 3e9, note: "$700M, лид Amazon" },
      { round: "Series E", year: 2021, valuationUSD: 27.6e9, note: "$5B+, перед IPO" },
    ] },
  { name: "UiPath", ticker: "PATH", sector: "Софт / Автоматизация (RPA)", ipoDate: "2021-04", ipoPriceUSD: 56, ipoValuationUSD: 29.1e9, currentPriceUSD: 11.24, currentMarketCapUSD: 5.82e9, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2019, valuationUSD: 7e9, note: "$568M, лид Coatue" },
      { round: "Series E", year: 2020, valuationUSD: 10.2e9, note: "$225M" },
      { round: "Series F", year: 2021, valuationUSD: 35e9, note: "пик $35B перед IPO" },
    ] },
];

// убрать плейсхолдер
const clean = data.filter((d) => d.ticker !== "SKIP");

db.prepare("DELETE FROM PublicCompany").run();
const cols =
  "id,name,ticker,sector,ipoDate,ipoPriceUSD,ipoValuationUSD,currentPriceUSD,currentMarketCapUSD,asOf,rounds,\"order\",createdAt";
const stmt = db.prepare(
  `INSERT INTO PublicCompany (${cols}) VALUES (@id,@name,@ticker,@sector,@ipoDate,@ipoPriceUSD,@ipoValuationUSD,@currentPriceUSD,@currentMarketCapUSD,@asOf,@rounds,@order,@createdAt)`
);
const now = new Date().toISOString();

// сортировка по P/L (текущая цена / цена IPO) убыв.
clean.sort(
  (a, b) =>
    b.currentPriceUSD / b.ipoPriceUSD - a.currentPriceUSD / a.ipoPriceUSD
);

clean.forEach((d, i) => {
  stmt.run({
    id: cuid("pc"),
    name: d.name,
    ticker: d.ticker,
    sector: d.sector,
    ipoDate: d.ipoDate,
    ipoPriceUSD: d.ipoPriceUSD,
    ipoValuationUSD: d.ipoValuationUSD,
    currentPriceUSD: d.currentPriceUSD,
    currentMarketCapUSD: d.currentMarketCapUSD,
    asOf: d.asOf,
    rounds: JSON.stringify(d.rounds),
    order: i,
    createdAt: now,
  });
});

console.log("Засеяно компаний:", clean.length);
for (const p of db.prepare('SELECT name,ticker,ipoPriceUSD,currentPriceUSD FROM PublicCompany ORDER BY "order"').all()) {
  const pl = Math.round((p.currentPriceUSD / p.ipoPriceUSD - 1) * 100);
  console.log(`  ${p.ticker.padEnd(5)} ${p.name.padEnd(22)} $${p.ipoPriceUSD} → $${p.currentPriceUSD}  (${pl >= 0 ? "+" : ""}${pl}%)`);
}
