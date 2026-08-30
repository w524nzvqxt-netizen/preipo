# Явная Docker-сборка для Railway.
# Причина: сборщик railpack падал на пустой env-переменной
# ("secret ID missing for '' environment variable"), т.к. монтирует ВСЕ
# переменные как build-секреты. Docker-сборка этого не делает — билд проходит.

FROM node:22-bookworm-slim

WORKDIR /app

# Системные зависимости:
# openssl — для Prisma; libatomic1 — для нативных модулей;
# python3/make/g++ — запасной путь сборки better-sqlite3, если нет prebuild.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates libatomic1 python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Весь проект нужен до npm ci: postinstall запускает `prisma generate`
# (читает prisma/schema.prisma и prisma.config.ts).
COPY . .

# Устанавливаем все зависимости (вкл. dev — нужны для сборки Next).
RUN npm ci

# Прод-сборка Next.js.
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Старт: само-сев dev.db (init-db) + prisma migrate deploy + next start.
# next start слушает порт из переменной PORT, которую задаёт Railway.
CMD ["npm", "run", "start"]
