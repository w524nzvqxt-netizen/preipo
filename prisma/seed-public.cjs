// Сидинг публичных компаний (уже вышедших на IPO) для раздела трек-рекорда рынка.
// Данные собраны командой агентов-исследователей с перепроверкой по источникам (июнь 2026).
const db = require("better-sqlite3")("C:/Users/user/Desktop/preipo-platform/dev.db");

function cuid(p) {
  return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
const B = 1e9, M = 1e6;

const data = [
  { name: "Astera Labs", ticker: "ALAB", sector: "AI-полупроводники", ipoDate: "2024-03", ipoPriceUSD: 36, ipoValuationUSD: 5.5 * B, currentPriceUSD: 317.06, currentMarketCapUSD: 54.32 * B, asOf: "2026-06",
    rounds: [
      { round: "Series A", year: 2018, valuationUSD: null, note: "Intel Capital, Sutter Hill; оценка не раскрыта" },
      { round: "Series C", year: 2021, valuationUSD: 0.95 * B, note: "$50M, Fidelity/Intel Capital" },
      { round: "Series D", year: 2022, valuationUSD: 3.1 * B, note: "$150M, лид Fidelity" },
    ] },
  { name: "Arm Holdings", ticker: "ARM", sector: "Полупроводники / IP", ipoDate: "2023-09", ipoPriceUSD: 51, ipoValuationUSD: 54.5 * B, currentPriceUSD: 342.93, currentMarketCapUSD: 366.27 * B, asOf: "2026-06",
    rounds: [
      { round: "Покупка SoftBank", year: 2016, valuationUSD: 32 * B, note: "SoftBank купил Arm за ~$32B" },
      { round: "Сделка Nvidia (сорвалась)", year: 2022, valuationUSD: 40 * B, note: "$40B, заблокирована регуляторами" },
    ] },
  { name: "Reddit", ticker: "RDDT", sector: "Соцсети / медиа", ipoDate: "2024-03", ipoPriceUSD: 34, ipoValuationUSD: 6.4 * B, currentPriceUSD: 173.45, currentMarketCapUSD: 33.39 * B, asOf: "2026-06",
    rounds: [
      { round: "Series B", year: 2014, valuationUSD: 0.5 * B, note: "$50M, Sam Altman/a16z/Sequoia" },
      { round: "Series C", year: 2017, valuationUSD: 1.8 * B, note: "$200M" },
      { round: "Series D", year: 2019, valuationUSD: 3 * B, note: "$300M, лид Tencent" },
      { round: "Series E", year: 2021, valuationUSD: 6.4 * B, note: "$368M, лид Vy Capital" },
      { round: "Series F", year: 2021, valuationUSD: 10 * B, note: "лид Fidelity, пик частной оценки" },
    ] },
  { name: "Circle", ticker: "CRCL", sector: "Финтех / Стейблкоины", ipoDate: "2025-06", ipoPriceUSD: 31, ipoValuationUSD: 6.9 * B, currentPriceUSD: 80.27, currentMarketCapUSD: 19.95 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2015, valuationUSD: 0.49 * B, note: "$50M, лид Goldman Sachs/IDG" },
      { round: "Series E", year: 2018, valuationUSD: 3 * B, note: "$110M, лид Bitmain; старт USDC" },
      { round: "SPAC (не состоялся)", year: 2022, valuationUSD: 9 * B, note: "$9B, сделка отменена" },
    ] },
  { name: "CoreWeave", ticker: "CRWV", sector: "AI-облако / инфраструктура", ipoDate: "2025-03", ipoPriceUSD: 40, ipoValuationUSD: 23 * B, currentPriceUSD: 102.91, currentMarketCapUSD: 54.77 * B, asOf: "2026-06",
    rounds: [
      { round: "Series B", year: 2023, valuationUSD: 2.2 * B, note: "$221M, Magnetar + Nvidia" },
      { round: "Secondary", year: 2023, valuationUSD: 7 * B, note: "рост ×3 за 5 месяцев" },
      { round: "Series C", year: 2024, valuationUSD: 19 * B, note: "$1.1B, лид Coatue" },
      { round: "Secondary", year: 2024, valuationUSD: 23 * B, note: "$650M, оценка $23B" },
    ] },
  { name: "Rubrik", ticker: "RBRK", sector: "Кибербезопасность / данные", ipoDate: "2024-04", ipoPriceUSD: 32, ipoValuationUSD: 5.6 * B, currentPriceUSD: 73.41, currentMarketCapUSD: 15.1 * B, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2017, valuationUSD: 1.3 * B, note: "$180M, лид IVP" },
      { round: "Series E", year: 2019, valuationUSD: 3.3 * B, note: "$261M, Bain/Lightspeed" },
      { round: "Series F", year: 2021, valuationUSD: 4 * B, note: "инвестор Microsoft" },
    ] },
  { name: "Robinhood", ticker: "HOOD", sector: "Финтех / Брокер", ipoDate: "2021-07", ipoPriceUSD: 38, ipoValuationUSD: 32 * B, currentPriceUSD: 81.38, currentMarketCapUSD: 74.33 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2017, valuationUSD: 1.3 * B, note: "$110M" },
      { round: "Series D", year: 2018, valuationUSD: 5.6 * B, note: "$363M, лид DST" },
      { round: "Series E", year: 2019, valuationUSD: 7.6 * B, note: "$323M, лид DST" },
      { round: "Series F", year: 2020, valuationUSD: 8.3 * B, note: "$280M, лид Sequoia" },
      { round: "Series G", year: 2020, valuationUSD: 11.7 * B, note: "лид D1 Capital, перед IPO" },
    ] },
  { name: "Hinge Health", ticker: "HNGE", sector: "Цифровое здоровье", ipoDate: "2025-05", ipoPriceUSD: 32, ipoValuationUSD: 2.6 * B, currentPriceUSD: 63.48, currentMarketCapUSD: 4.91 * B, asOf: "2026-06",
    rounds: [
      { round: "Series A", year: 2017, valuationUSD: 26.4 * M, note: "$9.6M" },
      { round: "Series B", year: 2018, valuationUSD: 90 * M, note: "$26M" },
      { round: "Series C", year: 2020, valuationUSD: 436 * M, note: "$91.5M" },
      { round: "Series D", year: 2021, valuationUSD: 3 * B, note: "$300M, Tiger/Coatue" },
      { round: "Series E", year: 2021, valuationUSD: 6.2 * B, note: "$400M, пик $6.2B" },
    ] },
  { name: "Instacart", ticker: "CART", sector: "Доставка продуктов", ipoDate: "2023-09", ipoPriceUSD: 30, ipoValuationUSD: 9.9 * B, currentPriceUSD: 41.26, currentMarketCapUSD: 9.7 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2015, valuationUSD: 2 * B, note: "$220M" },
      { round: "Series D", year: 2017, valuationUSD: 3.4 * B, note: "$400M" },
      { round: "Series E", year: 2018, valuationUSD: 4.35 * B, note: "$350M" },
      { round: "Series F", year: 2018, valuationUSD: 7.6 * B, note: "$600M" },
      { round: "Venture", year: 2020, valuationUSD: 13.7 * B, note: "$225M, ковидный рост" },
      { round: "Venture", year: 2020, valuationUSD: 17.7 * B, note: "$200M" },
      { round: "Venture (пик)", year: 2021, valuationUSD: 39 * B, note: "$265M, пик $39B" },
      { round: "Переоценка 409A", year: 2022, valuationUSD: 24 * B, note: "март 2022, −40%" },
      { round: "Переоценка 409A", year: 2022, valuationUSD: 13 * B, note: "октябрь 2022" },
      { round: "Переоценка 409A", year: 2022, valuationUSD: 10 * B, note: "декабрь 2022" },
    ] },
  { name: "Nu Holdings (Nubank)", ticker: "NU", sector: "Финтех / Необанк", ipoDate: "2021-12", ipoPriceUSD: 9, ipoValuationUSD: 41.4 * B, currentPriceUSD: 11.97, currentMarketCapUSD: 58.19 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2016, valuationUSD: 0.5 * B, note: "$52M, Founders Fund" },
      { round: "Series E", year: 2018, valuationUSD: 2 * B, note: "$150M, лид DST" },
      { round: "Series E (Tencent)", year: 2018, valuationUSD: 4 * B, note: "$180M от Tencent" },
      { round: "Series F", year: 2019, valuationUSD: 10 * B, note: "$400M, лид TCV" },
      { round: "Series G", year: 2021, valuationUSD: 25 * B, note: "$400M, GIC/Whale Rock" },
      { round: "Series G (ext)", year: 2021, valuationUSD: 30 * B, note: "Berkshire Hathaway, перед IPO" },
    ] },
  { name: "Tempus AI", ticker: "TEM", sector: "ИИ / Медицина", ipoDate: "2024-06", ipoPriceUSD: 37, ipoValuationUSD: 6.1 * B, currentPriceUSD: 46.43, currentMarketCapUSD: 8.34 * B, asOf: "2026-06",
    rounds: [
      { round: "Series G-1", year: 2020, valuationUSD: 5 * B, note: "$100M" },
      { round: "Series G-2", year: 2020, valuationUSD: 8.1 * B, note: "$200M, Google и др." },
      { round: "Series H", year: 2022, valuationUSD: 10.25 * B, note: "пик ~$10.25B (IPO ниже)" },
    ] },
  { name: "ServiceTitan", ticker: "TTAN", sector: "Софт / Вертикальный SaaS", ipoDate: "2024-12", ipoPriceUSD: 71, ipoValuationUSD: 6.3 * B, currentPriceUSD: 77.4, currentMarketCapUSD: 7.38 * B, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2018, valuationUSD: 1.65 * B, note: "$165M, T. Rowe/Dragoneer" },
      { round: "Series E", year: 2020, valuationUSD: 2.3 * B, note: "оценка ~$2.3B" },
      { round: "Series F", year: 2021, valuationUSD: 8.3 * B, note: "$500M, Tiger/Sequoia" },
      { round: "Series G", year: 2021, valuationUSD: 9.5 * B, note: "Thoma Bravo, пик" },
      { round: "Series H", year: 2022, valuationUSD: 7.37 * B, note: "down-round перед IPO" },
    ] },
  { name: "Coinbase", ticker: "COIN", sector: "Финтех / Крипто-биржа", ipoDate: "2021-04", ipoPriceUSD: 250, ipoValuationUSD: 65.3 * B, currentPriceUSD: 152.4, currentMarketCapUSD: 40.15 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2015, valuationUSD: 0.49 * B, note: "$75M, DFJ Growth" },
      { round: "Series D", year: 2017, valuationUSD: 1.6 * B, note: "$100M" },
      { round: "Series E", year: 2018, valuationUSD: 8 * B, note: "$300M" },
    ] },
  { name: "Chime", ticker: "CHYM", sector: "Финтех / Необанк", ipoDate: "2025-06", ipoPriceUSD: 27, ipoValuationUSD: 11.6 * B, currentPriceUSD: 18.08, currentMarketCapUSD: 6.92 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2018, valuationUSD: 0.52 * B, note: "$70M, Menlo Ventures" },
      { round: "Series D", year: 2019, valuationUSD: 1.5 * B, note: "$200M" },
      { round: "Series E", year: 2019, valuationUSD: 5.8 * B, note: "$500M" },
      { round: "Series F", year: 2020, valuationUSD: 14.5 * B, note: "$485M" },
      { round: "Series G", year: 2021, valuationUSD: 25 * B, note: "пик $25B, SoftBank" },
    ] },
  { name: "Figma", ticker: "FIG", sector: "Софт / Дизайн-инструменты", ipoDate: "2025-07", ipoPriceUSD: 33, ipoValuationUSD: 18.8 * B, currentPriceUSD: 21.46, currentMarketCapUSD: 11.89 * B, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2020, valuationUSD: 2 * B, note: "$50M" },
      { round: "Series E", year: 2021, valuationUSD: 10 * B, note: "$200M, Sequoia/a16z" },
      { round: "Adobe (сорвалась)", year: 2022, valuationUSD: 20 * B, note: "$20B, отменена 2023" },
      { round: "Tender offer", year: 2024, valuationUSD: 12.5 * B, note: "вторичный, ликвидность" },
    ] },
  { name: "Klaviyo", ticker: "KVYO", sector: "Софт / Маркетинг", ipoDate: "2023-09", ipoPriceUSD: 30, ipoValuationUSD: 9.2 * B, currentPriceUSD: 15.58, currentMarketCapUSD: 4.66 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C", year: 2020, valuationUSD: 4.15 * B, note: "$200M, Accel" },
      { round: "Series D", year: 2021, valuationUSD: 9.5 * B, note: "$320M, пик частной оценки" },
    ] },
  { name: "Klarna", ticker: "KLAR", sector: "Финтех / BNPL", ipoDate: "2025-09", ipoPriceUSD: 40, ipoValuationUSD: 15.1 * B, currentPriceUSD: 16.36, currentMarketCapUSD: 6.19 * B, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2019, valuationUSD: 5.5 * B, note: "крупнейший финтех Европы" },
      { round: "Раунд 2020", year: 2020, valuationUSD: 10.65 * B, note: "Silver Lake" },
      { round: "Раунд (март)", year: 2021, valuationUSD: 31 * B, note: "утроение за год" },
      { round: "Раунд (пик)", year: 2021, valuationUSD: 45.6 * B, note: "пик $45.6B, SoftBank" },
      { round: "Down-round", year: 2022, valuationUSD: 6.7 * B, note: "−85% от пика" },
      { round: "Переоценка", year: 2024, valuationUSD: 14.6 * B, note: "восстановление" },
      { round: "Pre-IPO", year: 2025, valuationUSD: 15 * B, note: "перед IPO" },
    ] },
  { name: "Ibotta", ticker: "IBTA", sector: "Реклама / Кэшбэк", ipoDate: "2024-04", ipoPriceUSD: 88, ipoValuationUSD: 2.67 * B, currentPriceUSD: 32.85, currentMarketCapUSD: 0.765 * B, asOf: "2026-06",
    rounds: [
      { round: "Series D", year: 2019, valuationUSD: 1 * B, note: "Koch Disruptive, статус единорога" },
    ] },
  { name: "Rivian", ticker: "RIVN", sector: "Электромобили", ipoDate: "2021-11", ipoPriceUSD: 78, ipoValuationUSD: 66.5 * B, currentPriceUSD: 16.54, currentMarketCapUSD: 20.93 * B, asOf: "2026-06",
    rounds: [
      { round: "Series C (Amazon)", year: 2019, valuationUSD: 3 * B, note: "$700M, лид Amazon" },
      { round: "Series C (Ford)", year: 2019, valuationUSD: 4.5 * B, note: "$500M, лид Ford" },
      { round: "Series E", year: 2021, valuationUSD: 27.6 * B, note: "$5B+, перед IPO" },
    ] },
  { name: "UiPath", ticker: "PATH", sector: "Софт / Автоматизация (RPA)", ipoDate: "2021-04", ipoPriceUSD: 56, ipoValuationUSD: 29.1 * B, currentPriceUSD: 11.24, currentMarketCapUSD: 5.82 * B, asOf: "2026-06",
    rounds: [
      { round: "Series B", year: 2018, valuationUSD: 1.1 * B, note: "$153M, лид CapitalG" },
      { round: "Series C", year: 2018, valuationUSD: 3 * B, note: "$265M" },
      { round: "Series D", year: 2019, valuationUSD: 7 * B, note: "$568M, лид Coatue" },
      { round: "Series E", year: 2020, valuationUSD: 10.2 * B, note: "$225M" },
      { round: "Series F", year: 2021, valuationUSD: 35 * B, note: "пик $35B перед IPO" },
    ] },
  // SpaceX — IPO 12.06.2026 по $135 при оценке $1.77T (сплит 5:1 в мае 2026).
  // Наш вход (FinSight) — май 2026 по оценке $1.2T.
  { name: "SpaceX", ticker: "SPAX", sector: "Космос / Starlink · IPO 12.06.2026", ipoDate: "2026-06", ipoPriceUSD: 135, ipoValuationUSD: 1770 * B, currentPriceUSD: 135, currentMarketCapUSD: 1770 * B, asOf: "2026-06",
    rounds: [
      { round: "Раунд 2019", year: 2019, valuationUSD: 33 * B, note: "≈$33B" },
      { round: "Раунд 2020", year: 2020, valuationUSD: 46 * B, note: "$1.9B, авг 2020" },
      { round: "Раунд 2021", year: 2021, valuationUSD: 74 * B, note: "$1.16B, фев 2021; Sequoia/Coatue/Fidelity" },
      { round: "Раунд 2021", year: 2021, valuationUSD: 100 * B, note: "окт 2021" },
      { round: "Раунд 2022", year: 2022, valuationUSD: 127 * B, note: "$1.68B, лид Mirae" },
      { round: "Раунд 2023", year: 2023, valuationUSD: 150 * B, note: "a16z и др." },
      { round: "Раунд 2024", year: 2024, valuationUSD: 210 * B, note: "июнь 2024" },
      { round: "Tender", year: 2024, valuationUSD: 350 * B, note: "дек 2024, $185/акц" },
      { round: "Tender", year: 2025, valuationUSD: 800 * B, note: "дек 2025" },
      { round: "Слияние с xAI", year: 2026, valuationUSD: 1250 * B, note: "фев 2026, объединённая компания $1.25T" },
      { round: "Наш вход (FinSight)", year: 2026, valuationUSD: 1200 * B, note: "май 2026 · вход по оценке $1.2T", ours: true },
      { round: "IPO (Nasdaq)", year: 2026, valuationUSD: 1770 * B, note: "12.06.2026 · $135/акц · $1.77T" },
    ] },
];

db.prepare("DELETE FROM PublicCompany").run();
const cols =
  "id,name,ticker,sector,ipoDate,ipoPriceUSD,ipoValuationUSD,currentPriceUSD,currentMarketCapUSD,asOf,rounds,\"order\",createdAt";
const stmt = db.prepare(
  `INSERT INTO PublicCompany (${cols}) VALUES (@id,@name,@ticker,@sector,@ipoDate,@ipoPriceUSD,@ipoValuationUSD,@currentPriceUSD,@currentMarketCapUSD,@asOf,@rounds,@order,@createdAt)`
);
const now = new Date().toISOString();

data.sort((a, b) => b.currentPriceUSD / b.ipoPriceUSD - a.currentPriceUSD / a.ipoPriceUSD);

data.forEach((d, i) => {
  stmt.run({
    id: cuid("pc"), name: d.name, ticker: d.ticker, sector: d.sector, ipoDate: d.ipoDate,
    ipoPriceUSD: d.ipoPriceUSD, ipoValuationUSD: d.ipoValuationUSD,
    currentPriceUSD: d.currentPriceUSD, currentMarketCapUSD: d.currentMarketCapUSD, asOf: d.asOf,
    rounds: JSON.stringify(d.rounds), order: i, createdAt: now,
  });
});

const totalRounds = data.reduce((s, d) => s + d.rounds.filter((r) => r.valuationUSD).length, 0);
console.log("Засеяно компаний:", data.length, "| раундов с оценкой:", totalRounds);
for (const p of db.prepare('SELECT name,ticker,rounds FROM PublicCompany ORDER BY "order"').all()) {
  const rs = JSON.parse(p.rounds);
  console.log(`  ${p.ticker.padEnd(5)} ${p.name.padEnd(22)} раундов с оценкой: ${rs.filter((r) => r.valuationUSD).length}`);
}
