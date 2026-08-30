// Данные видео-сцен для сделок (как у Prometheus): озвучка + визуал.
// Используется и для генерации аудио (HeyGen), и для рендера (Remotion).
const EM = "#34D399", SKY = "#38BDF8", AMB = "#FBBF24", GOLD = "#D6B56D";

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
  {
    slug: "finsight", name: "FinSight Physical AI Fund",
    scenes: [
      // 1 · Титул
      { narration: "ФинСайт Физикал Эй-Ай Фанд — фонд для инвестиций в лидеров Physical AI, искусственного интеллекта, который действует в физическом мире.",
        visual: { type: "video", src: "uploads/v2/clip-ailab.mp4", title: "FinSight Physical AI Fund", subtitle: "Инвестиции в лидеров Physical AI · 2026", accent: GOLD } },
      // 2 · Три волны ИИ
      { narration: "Искусственный интеллект прошёл три волны. Сначала — восприятие: машины научились видеть и слышать. Затем — генерация текста, изображений и кода. Теперь наступает третья волна: действие в реальном мире.",
        visual: { type: "timeline", title: "Третья волна искусственного интеллекта", cols: [
          { k: "I · Восприятие", t: "2012", d: "AlexNet и ResNet — машины научились видеть и слышать" },
          { k: "II · Генерация", t: "2019", d: "Transformer и GPT — ИИ создаёт текст, изображения и код" },
          { k: "III · Действие", t: "2025", d: "VLA-модели и роботы — Physical AI действует в мире", hot: true },
        ] } },
      // 3 · Демография
      { narration: "Спрос на Physical AI обеспечен демографией. К 2050 году развитые экономики теряют триста сорок два миллиона трудоспособных, а масштабно закрыть этот дефицит способен только искусственный интеллект.",
        visual: { type: "stat", kicker: "Спрос обеспечен демографией", value: "−342 млн", label: "трудоспособных теряют развитые экономики к 2050 году",
          sub: "Регионы сокращения дают ~55% мирового ВВП · закрыть дефицит масштабно может только ИИ" } },
      // 4 · Таланты
      { narration: "В Physical AI перешли лучшие умы планеты — исследователи и основатели, определившие эпоху генеративного ИИ в OpenAI, Google DeepMind, Meta и Стэнфорде.",
        visual: { type: "list", kicker: "Лучшие таланты мира", title: "Создатели эпохи Gen AI выбрали Physical AI", items: [
          "Демис Хассабис · Google DeepMind → Isomorphic Labs",
          "Фей-Фей Ли · Stanford → World Labs",
          "Сергей Левин · Berkeley → Physical Intelligence",
          "Джим Фан · OpenAI → NVIDIA GEAR",
          "Джефф Безос · Amazon → Project Prometheus",
        ] } },
      // 5 · Рынок
      { narration: "Капитализация Physical AI может достичь пяти целых семи десятых триллиона долларов к 2031 году. Для этого достаточно развернуть меньше роботов, чем сегодня автомобилей на дорогах мира.",
        visual: { type: "stat", kicker: "Размер рынка", value: "$5,7 трлн", label: "капитализация Physical AI к 2031 году",
          sub: "Сценарная проекция · 0,33–1 млрд роботов к 2050 — меньше, чем автомобилей сегодня (~1,5 млрд)" } },
      // 6 · Рост VC
      { narration: "Мировые фонды системно наращивают экспозицию: доля Physical AI в венчурном финансировании выросла с ноля целых восьми десятых процента в 2016 году до двенадцати процентов в 2025-м.",
        visual: { type: "bars", title: "Доля Physical AI в мировом венчурном финансировании", unit: "% мирового VC · 2016 → 2025 · источник: PitchBook", items: [
          { label: "2016", value: 0.8, display: "0,8%" },
          { label: "2018", value: 1.5, display: "1,5%" },
          { label: "2020", value: 4.0, display: "4,0%" },
          { label: "2022", value: 4.2, display: "4,2%" },
          { label: "2023", value: 5.7, display: "5,7%" },
          { label: "2024", value: 8.5, display: "8,5%" },
          { label: "2025", value: 12.0, display: "12%", hot: true },
        ] } },
      // 7 · Тайминг
      { narration: "Сегодня — правильная точка входа. Генеративный ИИ переоценился в шесть целых восемь десятых раза за полтора года. Physical AI находится там же, где Gen AI был в конце 2024 года.",
        visual: { type: "stat", kicker: "Правильный тайминг", value: "6,8×", label: "репрайсинг Gen AI за 18 месяцев",
          sub: "Physical AI сегодня — на той же точке входа, что Gen AI в конце 2024 года" } },
      // 8 · Условия фонда
      { narration: "Фонд формирует концентрированный портфель из десяти-двенадцати лидеров в четырёх сегментах. Размер — пятьдесят миллионов долларов, взнос команды — десять процентов, срок — пять лет.",
        visual: { type: "grid", kicker: "Структура", title: "Условия фонда", rows: [
          ["Размер фонда", "$50 млн"], ["GP commitment", "10%"], ["Портфель", "10–12 · 4 сегмента"], ["Срок · комиссии", "5 лет · 2% / 20%"],
        ] } },
      // 9 · Трек-рекорд
      { narration: "Это продолжение стратегии, уже подтверждённой результатом: Gen AI-фонд ФинСайт за первый год дал тридцать восемь процентов годовых и три события ликвидности.",
        visual: { type: "grid", kicker: "Подтверждено результатом", title: "Трек Gen AI-фонда FinSight", rows: [
          ["IRR за 1-й год", "38%"], ["TVPI", "1,30x"], ["События ликвидности", "3"], ["Опыт · портфель", "20 лет · $1,32 млрд"],
        ] } },
      // 10 · CTA
      { narration: "Physical AI — определяющая инвестиционная возможность десятилетия. Войдите вместе с ФинСайт.",
        visual: { type: "video", src: "uploads/v2/clip-finance.mp4", title: "Physical AI — возможность десятилетия", subtitle: "FinSight Physical AI Fund", accent: GOLD } },
    ],
  },
];

module.exports = { DEALS };
