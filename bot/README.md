# Telegram-бот правок сайта

Пишешь боту правку по сайту → запускается Claude-агент прямо в репозитории →
он правит код/контент, собирает (`npm run build`), коммитит и пушит → Railway
пересобирает прод. Отвечает в чат, что сделал.

> ⚠️ Это автономный кодинг-агент с доступом к шеллу и git-пушу. Доступ строго по
> `AUTHORIZED_CHAT_ID` (только твой чат). Токены держи в секрете.

## 1. Создать бота
1. Открой **@BotFather** в Telegram → `/newbot` → получи **TELEGRAM_BOT_TOKEN**.
2. Узнай свой **chat id**: напиши **@userinfobot** (пришлёт число).

## 2. Нужные ключи (env)
| Переменная | Откуда |
|---|---|
| `TELEGRAM_BOT_TOKEN` | от BotFather |
| `AUTHORIZED_CHAT_ID` | твой chat id (только ты можешь командовать) |
| `ANTHROPIC_API_KEY` | console.anthropic.com (расходуется на каждую правку) |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Personal access token (repo: contents read/write) — для пуша |
| `GITHUB_REPO` | `w524nzvqxt-netizen/preipo` (по умолчанию) |
| `BOT_MODEL` | опц., по умолчанию `claude-sonnet-4-6` |

## 3. Запуск

### Вариант A — на своём ПК / VPS (проще всего)
```bash
cd bot
npm install
# задай переменные окружения (или .env + dotenv)
TELEGRAM_BOT_TOKEN=... AUTHORIZED_CHAT_ID=... ANTHROPIC_API_KEY=... GITHUB_TOKEN=... npm start
```
При первом запуске бот клонирует репозиторий в `bot/repo` и сделает `npm install`
(один раз, небыстро — Next.js).

### Вариант B — отдельный сервис на Railway
1. New Service → Deploy from GitHub repo (тот же `preipo`).
2. **Settings → Root Directory** = `bot`.
3. **Variables** — все ключи из таблицы выше.
4. Нужен план с достаточной памятью (бот клонирует и собирает основной сайт).

## Как пользоваться
Пиши боту обычным текстом, например:
- «поменяй слоган на главной на …»
- «у Cashea исправь объём раунда на $30M»
- «добавь компанию X как открытый раунд» (можно приложить факты)
- «сделай кнопку заявки крупнее на мобиле»

Бот ответит «делаю…», покажет ход и в конце — что сделал. Прод обновится через
пару минут (Railway).

> Совет: формулируй конкретно. Бот сам проверяет сборку и не пушит сломанный код.
