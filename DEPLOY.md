# Публикация сайта (деплой)

Пошагово, для новичка. Рекомендуемый хостинг — **Railway** (постоянный сервер + диск, минимум настройки). SQLite и логотипы/видео работают как есть.

## 0. Что уже готово в репозитории
- `.gitignore` исключает секреты (`.env`), локальную базу (`*.db`) и артефакты.
- `.env.example` — список нужных переменных окружения.
- `package.json`:
  - `postinstall` → `prisma generate` (клиент собирается на хостинге);
  - `start` → `prisma migrate deploy && next start` (применяет миграции и запускает прод).

## 1. Залить код на GitHub
```bash
cd /Users/pirskiyka/preipo-platform
git add -A
git commit -m "Подготовка к деплою"
```
Создай пустой репозиторий на github.com (кнопка New). Затем:
```bash
git remote add origin https://github.com/ТВОЙ_ЛОГИН/preipo-platform.git
git branch -M main
git push -u origin main
```

## 2. Создать проект на Railway
1. Зарегистрируйся на **railway.app** (войти через GitHub).
2. **New Project → Deploy from GitHub repo** → выбери `preipo-platform`.
3. Railway сам определит Next.js, поставит зависимости и соберёт.

## 3. Прописать переменные окружения
В проекте → вкладка **Variables** → добавь (значения — из своего `.env`):
- `ANTHROPIC_API_KEY`
- `HEYGEN_API_KEY`
- `ADMIN_PASSWORD` (смени на свой!)
- `NEXT_PUBLIC_TELEGRAM`, `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_EMAIL`
- `DATABASE_URL` = `file:/data/prod.db`

## 4. Подключить постоянный диск (для базы)
В проекте → **Volumes → New Volume** → mount path: **`/data`**.
Так база (`/data/prod.db`) переживёт перезапуски и деплои.

> Демо-данные: после первого деплоя можно один раз заполнить базу — в Railway открой **Shell** проекта и выполни `npm run seed` (необязательно).

## 5. Открыть сайт
Railway → **Settings → Networking → Generate Domain** → получишь ссылку вида
`preipo-platform-production.up.railway.app`. Готово — сайт публичный.

Свой домен: **Custom Domain** → добавь домен и пропиши CNAME у регистратора.

## Важно про загрузки файлов
Файлы, загруженные через админку в рантайме, и видео от HeyGen сохраняются в `public/uploads`. Чтобы они тоже переживали деплои, можно примонтировать том на `public/uploads` (отдельный Volume) — но тогда туда не попадут логотипы/видео из репозитория. Для витрины этого достаточно; полноценное решение — вынести загрузки в облачное хранилище (S3 / Cloudflare R2) позже.

## Альтернатива: Vercel (бесплатно, больше настройки)
Требует перевода базы на облачную (Turso/Neon) и файлов на Vercel Blob — скажи, если выберешь этот путь, подготовлю отдельно.
