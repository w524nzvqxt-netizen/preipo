// Данные видео-сцен для сделок (как у Prometheus): озвучка + визуал.
// Используется и для генерации аудио (HeyGen), и для рендера (Remotion).
const EM = "#34D399", SKY = "#38BDF8", AMB = "#FBBF24";

const DEALS = [
  {
    slug: "cashea", name: "Cashea",
    scenes: [
      { narration: "Cashea — самое скачиваемое приложение и монополист потребительского кредитования в Венесуэле.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Cashea", subtitle: "Суперапп №1 в Венесуэле" } },
      { narration: "В 2025 году обороты достигли трёх с половиной миллиардов долларов при чистой прибыли тридцать четыре миллиона.",
        visual: { type: "video", src: "uploads/v2/clip-industrial.mp4", caption: "GMV $3,5 млрд · прибыль $34M" } },
      { narration: "Девять миллионов пользователей и уровень просрочки ниже, чем у NuBank.",
        visual: { type: "video", src: "uploads/v2/clip-manufacturing.mp4", caption: "9 млн пользователей · NPL 2,4%" } },
      { narration: "Вход по оценке пятьсот пятьдесят восемь миллионов; ожидаемая капитализация на выходе — пять миллиардов долларов.",
        visual: { type: "metrics", title: "Оценка и прогноз", rows: [["Цена входа", "$558 млн"], ["Капитализация на IPO", "$5 млрд"], ["Выход", "1Q 2030 · IPO"], ["Потенциал", "×5,6"]] } },
      { narration: "Потенциал на капитал — в пять с половиной раз по базовому сценарию и более чем в десять по оптимистичному.",
        visual: { type: "scenarios", items: [ { k: "Лучший", val: 1050000, mult: 10.5, irr: "~78%", color: EM }, { k: "Базовый", val: 560000, mult: 5.6, irr: "~56%", color: SKY }, { k: "Худший", val: 280000, mult: 2.8, irr: "~32%", color: AMB } ] } },
      { narration: "Реализованная сделка из портфеля Pre-IPO Витрины.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Войдите до IPO", subtitle: "Pre-IPO Витрина" } },
    ],
  },
  {
    slug: "cursor", name: "Cursor",
    scenes: [
      { narration: "Cursor — искусственный интеллект для разработчиков, который сам пишет код и автоматизирует разработку.",
        visual: { type: "video", src: "uploads/v2/clip-ailab.mp4", title: "Cursor", subtitle: "Революция в AI-программировании" } },
      { narration: "Компания достигла двух миллиардов выручки всего за два года — наравне с OpenAI и Anthropic.",
        visual: { type: "video", src: "uploads/v2/clip-datacenter.mp4", caption: "$2 млрд ARR за два года" } },
      { narration: "Cursor используют шестьдесят четыре процента компаний из списка Fortune пятьсот.",
        visual: { type: "video", src: "uploads/v2/clip-chip.mp4", caption: "64% Fortune 500 — клиенты" } },
      { narration: "Вход по оценке пятьдесят один миллиард; ожидаемая капитализация на выходе — сто восемьдесят четыре миллиарда долларов.",
        visual: { type: "metrics", title: "Оценка и прогноз", rows: [["Цена входа", "$51,4 млрд"], ["Капитализация на IPO", "$184 млрд"], ["Выход", "H2 2028 · IPO"], ["Потенциал", "×2,2"]] } },
      { narration: "Потенциал на капитал — более чем в два раза по базовому сценарию и до пяти по оптимистичному.",
        visual: { type: "scenarios", items: [ { k: "Лучший", val: 500000, mult: 5.0, irr: "~81%", color: EM }, { k: "Базовый", val: 224000, mult: 2.24, irr: "~35%", color: SKY }, { k: "Худший", val: 130000, mult: 1.3, irr: "~10%", color: AMB } ] } },
      { narration: "Реализованная сделка из портфеля Pre-IPO Витрины.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Войдите до IPO", subtitle: "Pre-IPO Витрина" } },
    ],
  },
  {
    slug: "tamara", name: "Tamara",
    scenes: [
      { narration: "Tamara — лидирующий финансовый суперапп Саудовской Аравии, NuBank Ближнего Востока.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Tamara", subtitle: "Финтех-суперапп Саудовской Аравии" } },
      { narration: "В 2025 году обороты достигли семи с половиной миллиардов долларов, выручка выросла на восемьдесят два процента.",
        visual: { type: "video", src: "uploads/v2/clip-industrial.mp4", caption: "GMV $7,6 млрд · выручка $384M" } },
      { narration: "Шестнадцать миллионов пользователей и первая в стране лицензия на потребительское кредитование.",
        visual: { type: "video", src: "uploads/v2/clip-manufacturing.mp4", caption: "16 млн пользователей · лицензия ЦБ" } },
      { narration: "Вход по оценке два и восемь миллиарда; ожидаемая капитализация на выходе — около восьми миллиардов долларов.",
        visual: { type: "metrics", title: "Оценка и прогноз", rows: [["Цена входа", "$2,8 млрд"], ["Капитализация на IPO", "$8,4 млрд"], ["Выход", "1H 2028 · Tadawul"], ["Потенциал", "×2,5"]] } },
      { narration: "Потенциал на капитал — в два с половиной раза по базовому сценарию и до четырёх по оптимистичному.",
        visual: { type: "scenarios", items: [ { k: "Лучший", val: 410000, mult: 4.1, irr: "~90%", color: EM }, { k: "Базовый", val: 250000, mult: 2.5, irr: "~49%", color: SKY }, { k: "Худший", val: 150000, mult: 1.5, irr: "~19%", color: AMB } ] } },
      { narration: "Реализованная сделка из портфеля Pre-IPO Витрины.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Войдите до IPO", subtitle: "Pre-IPO Витрина" } },
    ],
  },
  {
    slug: "openevidence", name: "OpenEvidence",
    scenes: [
      { narration: "OpenEvidence — самый быстрорастущий искусственный интеллект для врачей в США.",
        visual: { type: "video", src: "uploads/v2/clip-ailab.mp4", title: "OpenEvidence", subtitle: "ChatGPT для врачей" } },
      { narration: "Каждый день платформой пользуются сорок пять процентов всех врачей страны.",
        visual: { type: "video", src: "uploads/v2/clip-simulation.mp4", caption: "45% врачей США — ежедневно" } },
      { narration: "Годовая выручка выросла с семи до ста пятидесяти миллионов всего за один год.",
        visual: { type: "video", src: "uploads/v2/clip-datacenter.mp4", caption: "ARR $7M → $150M за год" } },
      { narration: "Вход по оценке четырнадцать с половиной миллиардов; ожидаемая капитализация на выходе — около пятидесяти пяти.",
        visual: { type: "metrics", title: "Оценка и прогноз", rows: [["Цена входа", "$14,5 млрд"], ["Капитализация на IPO", "$54,7 млрд"], ["Выход", "H2 2028 · IPO"], ["Потенциал", "×2,5"]] } },
      { narration: "Потенциал на капитал — в два с половиной раза по базовому сценарию и до пяти по оптимистичному.",
        visual: { type: "scenarios", items: [ { k: "Лучший", val: 500000, mult: 5.0, irr: "~78%", color: EM }, { k: "Базовый", val: 249000, mult: 2.49, irr: "~38%", color: SKY }, { k: "Худший", val: 130000, mult: 1.3, irr: "~10%", color: AMB } ] } },
      { narration: "Реализованная сделка из портфеля Pre-IPO Витрины.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Войдите до IPO", subtitle: "Pre-IPO Витрина" } },
    ],
  },
];

module.exports = { DEALS };
