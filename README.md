# Pre-IPO Витрина

Сайт-витрина pre-IPO проектов: посетитель (клиент или фин. советник) видит актуальные проекты — цены, объёмы, минимальный чек — и оставляет заявку. Оператор управляет проектами и видит заявки в админке.

## Возможности

- **Витрина** (`/`) — публичный список активных проектов с ценой, объёмом, мин. чеком и оценкой.
- **Страница проекта** (`/project/[id]`) — полная карточка + форма заявки.
- **Связь** — кнопки Telegram / WhatsApp / Email + форма заявки (лид падает в базу).
- **Админка** (`/admin`) — вход по паролю; управление проектами (создать/изменить/скрыть/удалить) и заявками (статусы new → в работе → закрыта).

## Стек

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind · Prisma 7 + SQLite (драйвер better-sqlite3).

## Запуск

```bash
npm install
npx prisma migrate dev      # применить миграции
npm run seed                # демо-проекты (необязательно)
npm run dev                 # http://localhost:3000
```

## Настройка (`.env`)

```
DATABASE_URL="file:./dev.db"     # база
ADMIN_PASSWORD="admin123"        # пароль входа в админку — СМЕНИТЕ!
NEXT_PUBLIC_TELEGRAM="https://t.me/your_username"
NEXT_PUBLIC_WHATSAPP="https://wa.me/79990000000"
NEXT_PUBLIC_EMAIL="you@example.com"
```

## Полезные команды

```bash
npm run seed        # перезалить демо-данные
npm run db:reset    # сбросить базу и миграции
npm run build       # продакшн-сборка
```

## Структура

```
prisma/schema.prisma          модели Project и Lead
prisma/seed.ts                демо-данные
src/lib/                      prisma-клиент, форматирование, auth, контакты
src/components/               ProjectCard, ProjectForm, LeadForm, ContactButtons
src/app/                      витрина, страница проекта, server actions
src/app/admin/                логин + (protected) дашборд, проекты, заявки
docs/DESIGN.md                проектный документ
```

## Дальше можно добавить

Фильтры/поиск по проектам, аналитику и сценарии доходности, конструктор портфеля, уведомления о новых заявках (email/Telegram-бот), загрузку логотипов файлом, мультиязычность.
