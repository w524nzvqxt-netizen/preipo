# Pre-IPO Витрина — руководство для Claude

Этот файл Claude Code читает автоматически. Здесь — вся суть проекта и как с ним работать.

## Что это
Сайт-витрина pre-IPO проектов: посетитель видит компании (цены, объёмы, доходность, оценка, прогноз выхода), смотрит видео-объяснялку, оставляет заявку. Оператор управляет всем через админку. Есть AI-агенты и генерация видео.

## Стек
- **Next.js 16** (App Router, src-dir, TypeScript) — ⚠️ свежая версия, `params` асинхронные (`await params`).
- **Prisma 7 + SQLite** — ⚠️ подключение через драйвер-адаптер `@prisma/adapter-better-sqlite3` (см. `src/lib/prisma.ts`), `url` в схеме НЕ указывается. Тип `Project` импортировать из `@/generated/prisma/client`.
- **Tailwind v4**, шрифт Manrope.
- **Анимации:** Framer Motion (`motion`) + **GSAP + ScrollTrigger** + **Lenis** (плавный скролл). Компоненты в `src/components/motion/`.
- **Видео:** Remotion (рендер в `remotion/`), Higgsfield (MCP `hig`) для клипов, HeyGen API для русской озвучки.

## Дизайн
Гибрид: **тёмные кинематографичные секции** (hero, преимущества, контакты — `bg-[#070710]`, свечение-орбы, glow, GSAP-параллакс) + **светлая витрина** проектов. Установлен скилл **ui-ux-pro-max** (`~/.claude/skills/`) — применять его правила (dark-mode тона + контраст, тайминги 150–300мс, консистентные тени).

## Данные и контент
- Контент (проекты, котировки, заявки) — в **`dev.db`** (закоммичена в репозиторий, чтобы прод был с контентом).
- Менять контент — через **админку** (`/admin`, пароль в `.env` → `ADMIN_PASSWORD`, сейчас `admin123`). Кнопки админки на публичном сайте нет — заходить по прямому адресу `/admin`.
- Модели: `Project` (+ salesPoints/pros/risks/scenarios/videoUrl/videoScript), `Quote` (бегущая строка котировок), `Lead`, `ProjectDocument`.

## AI-агенты (`src/lib/ai.ts`, действия в `src/app/admin/actions.ts`)
Все на модели `claude-opus-4-8`, требуют `ANTHROPIC_API_KEY` в `.env`:
- `generateProjectBrief` — описание + сейлз-поинты + плюсы + риски.
- `polishText` — «сделать презентабельнее».
- `generateVideoScenes` — сценарий видео о проекте.
- `analyzeFinancials` / `generateCompanyDeck` — читает PDF, делает анализ / презентацию (pptxgenjs).
Кнопки — на странице редактирования проекта в админке.

## Видео-пайплайн
- Клипы: MCP `hig` (Higgsfield, `seedance_2_0`). Вертикаль 9:16 для шортсов, 16:9 для главной. ⚠️ Не зацикливать клипы — генерировать уникальные.
- Озвучка: **HeyGen** (`HEYGEN_API_KEY`), голос **Dmitry** (`voice_id` 5f99970adadb42398bf1aeb963a3888b), нужны API-кредиты. Генерим видео с аватаром → извлекаем аудио (ffmpeg-static).
- Сборка: **Remotion** — `remotion/render.ts` (видео о компании, 16:9), `remotion/render-explainer.ts` (главная), `remotion/render-short.ts` (шортсы 9:16). Запуск: `npx tsx remotion/render-*.ts`.
- Готовые видео для сайта лежат в `public/uploads/` (главная — `main-pre-ipo.mp4`; видео проекта — `prometheus-video.mp4`).

## Деплой (Railway)
1. Запушить на GitHub (`github.com/w524nzvqxt-netizen/preipo`) → Railway пересобирает сам.
2. На Railway в Variables: ключи + **`DATABASE_URL=file:./dev.db`** (база с контентом из репо).
3. Заявки/загрузки на проде эфемерны (база в репо, не на диске) — позже вынести в Neon + R2/S3.
Подробно — `DEPLOY.md`.

## Локальный запуск
```
npm install
npx prisma generate
npm run dev   # http://localhost:3000
```

## Стиль работы (важно)
Пользователь пишет на русском — отвечать на русском. Любит скорость и автономность: делать самому, не задавать лишних вопросов, спрашивать только на реальных развилках. Тщательно проверять факты (оценки компаний меняются — гуглить).

## Полезные файлы
- `docs/DESIGN.md` — проектный документ
- `docs/SHORTS.md` — 10 сценариев шортсов
- `docs/VIDEO_SCRIPT.md` — сценарий объяснялки

---

# This is NOT the Next.js you know
Версия Next.js свежая, есть ломающие изменения. При сомнениях — читать `node_modules/next/dist/docs/`.
