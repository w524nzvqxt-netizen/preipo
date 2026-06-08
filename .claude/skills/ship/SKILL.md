---
name: ship
description: Собрать, проверить и задеплоить сайт на Railway. Используй, когда нужно выкатить изменения в прод — билд → smoke-тест → commit → push (Railway пересобирает сам с GitHub). Также при «накати», «задеплой», «выкати на сайт».
---

# Выкатка сайта (site / deploy)

Стек: Next.js 16 + Prisma/SQLite (контент в закоммиченной `dev.db`), GitHub `w524nzvqxt-netizen/preipo` → Railway (auto-deploy). Прод: `preipo-production.up.railway.app` и `pre-ipo.pro`.

## Процедура
1. **Билд:** `npm run build` — должно быть `Compiled successfully` + `TypeScript OK`, без ошибок. Если падает — чини, не пушь.
2. **Smoke:** подними `npm run dev` (убей прежние node), проверь ключевые страницы → `200`:
   `/`, `/exits`, `/portfolio`, `/project/<id>`, `/privacy`. Грепни HTML на наличие нужного контента (помни: client-компоненты и текст в `<span>` по словам могут не грепаться — это норма).
3. **Коммит:** `git add` нужные файлы. **НЕ коммить** `.env` и `.claude/settings.local.json` (`git reset HEAD .claude`). Видео в `public/uploads/v2/` игнорятся — это ок (на прод идут готовые mp4 из `public/uploads/`).
4. Сообщение коммита по-русски, в конце `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. `git push origin main`.
5. **Проверь живой прод** через 2-4 мин: `curl` страниц на 200 + наличие контента.

## Правила
- Не пушить, если билд падает или состояние некогерентно (полу-редизайн).
- Данные меняются через админку или скрипты в `prisma/` (`add-deal.cjs`, `gen-analysis.cjs`, сиды) — они пишут в `dev.db`, которую коммитим.
- Видео тяжёлое — сжимай faststart (`-movflags +faststart`); для максимального качества faststart без потери: `-c copy -movflags +faststart`.
