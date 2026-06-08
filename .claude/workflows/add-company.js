export const meta = {
  name: 'add-company',
  description: 'Новая pre-IPO компания: проверка фактов + генерация контента → готовый JSON для карточки',
  whenToUse: 'Когда пришли материалы о новой компании (меморандум/тизер/калькулятор) и нужно быстро собрать карточку.',
  phases: [
    { title: 'Факты', detail: 'веб-проверка текущей оценки и раундов' },
    { title: 'Контент', detail: 'описание, сейлз-поинты, плюсы/риски, сценарии, числа' },
  ],
}

// args = {
//   name: "Tamara",
//   sector: "Финтех / BNPL (Саудовская Аравия)",   // опционально
//   dealStatus: "open" | "closed",
//   sourceText: "<текст меморандума/тизера + выжимка из xlsx-калькулятора>"
// }
const A = args || {}
const name = A.name || 'Компания'
const dealStatus = A.dealStatus === 'closed' ? 'closed' : 'open'
const sourceText = A.sourceText || ''

phase('Факты')
const FACTS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['currentValuationUSD', 'lastRound', 'ipoExpectation', 'notes', 'sources'],
  properties: {
    currentValuationUSD: { type: ['number', 'null'], description: 'текущая рыночная/последняя оценка, USD' },
    lastRound: { type: 'string', description: 'последний раунд: дата, оценка, инвесторы' },
    ipoExpectation: { type: 'string', description: 'ожидания/сроки IPO, если есть' },
    notes: { type: 'string', description: 'важные факты/нюансы для карточки' },
    sources: { type: 'array', items: { type: 'string' } },
  },
}
const facts = await agent(
  `Ты — финансовый аналитик. Перепроверь по нескольким веб-источникам АКТУАЛЬНЫЕ факты о компании «${name}» (сегодня июнь 2026): последний раунд и оценка, текущая рыночная оценка, ожидания по IPO. Кратко и по делу, без воды. Если данных нет — null/пусто, не выдумывай.\n\nКонтекст из материалов клиента:\n${sourceText.slice(0, 6000)}`,
  { label: `факты:${name}`, phase: 'Факты', schema: FACTS_SCHEMA }
)

phase('Контент')
const DEAL_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['name', 'sector', 'dealStatus', 'description', 'salesPoints', 'pros', 'risks',
    'valuation', 'exitValuation', 'cocMultiple', 'expectedReturn', 'expectedExit',
    'pricePerShare', 'volume', 'currency', 'isHot', 'scenarios'],
  properties: {
    name: { type: 'string' },
    sector: { type: 'string' },
    dealStatus: { type: 'string', enum: ['open', 'closed'] },
    description: { type: 'string', description: '2-4 предложения, по-русски, ёмко' },
    salesPoints: { type: 'array', items: { type: 'string' }, description: '4 сильных сейлз-поинта' },
    pros: { type: 'array', items: { type: 'string' }, description: '3 плюса' },
    risks: { type: 'array', items: { type: 'string' }, description: '3 честных риска' },
    valuation: { type: ['number', 'null'], description: 'цена входа (entry EV), USD' },
    exitValuation: { type: ['number', 'null'], description: 'ожидаемая капитализация на IPO, USD' },
    cocMultiple: { type: ['number', 'null'], description: 'потенциал на капитал нетто (напр. 2.5)' },
    expectedReturn: { type: ['number', 'null'], description: 'доходность нетто, %/год' },
    expectedExit: { type: ['string', 'null'], description: 'напр. "1H 2028 · IPO"' },
    pricePerShare: { type: ['number', 'null'] },
    volume: { type: ['number', 'null'], description: 'объём раунда, USD' },
    currency: { type: 'string' },
    isHot: { type: 'boolean' },
    scenarios: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['key', 'color', 'mult', 'irr'],
        properties: {
          key: { type: 'string', enum: ['Худший', 'Базовый', 'Лучший'] },
          color: { type: 'string', enum: ['amber', 'sky', 'emerald'] },
          mult: { type: 'number' },
          irr: { type: 'string' },
        },
      },
      description: '3 сценария на $100k: amber=Худший, sky=Базовый, emerald=Лучший',
    },
  },
}
const deal = await agent(
  `Ты — инвестиционный аналитик pre-IPO витрины. Собери карточку компании «${name}» (сектор: ${A.sector || 'определи сам'}; статус сделки: ${dealStatus}).\n\nИСХОДНЫЕ МАТЕРИАЛЫ КЛИЕНТА:\n${sourceText.slice(0, 9000)}\n\nПРОВЕРЕННЫЕ ФАКТЫ (веб):\n${JSON.stringify(facts, null, 2)}\n\nЗадача: верни строго структуру. Числа (valuation/exitValuation/cocMultiple/expectedReturn/expectedExit/pricePerShare/volume) бери из материалов; если в материалах нет — оставь null, не выдумывай. Тексты — по-русски, конкретно, без канцелярита. Сценарии (худший/базовый/лучший) — реалистичные множители на основе материалов; базовый ≈ cocMultiple. dealStatus="${dealStatus}".`,
  { label: `контент:${name}`, phase: 'Контент', schema: DEAL_SCHEMA }
)

return { deal, facts }
