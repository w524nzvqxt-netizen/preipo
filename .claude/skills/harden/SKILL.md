---
name: harden
description: Аудит и усиление безопасности сайта — админка, заголовки, Cloudflare, персональные данные. Используй для «защита», «безопасность», «секьюрити», «аудит», «закрой дыры».
---

# Защита сайта (security)

## 1. Аудит кода
- Запусти встроенный **`/security-review`** — обзор изменений на инъекции/XSS/обход авторизации/секреты.
- Проверь Prisma-запросы (параметризованы), отсутствие `dangerouslySetInnerHTML`, валидацию серверных экшенов.

## 2. Админка (`src/lib/auth.ts`, `src/app/admin/actions.ts`)
- `ADMIN_PASSWORD` на Railway Variables — **НЕ дефолтный `admin123`**, длинный случайный.
- Cookie: `httpOnly` + `secure` (в проде), токен = хэш пароля (не сам пароль), сравнение `timingSafeEqual`, fail-closed без пароля.
- Rate-limit логина (по IP), security-заголовки в `next.config.ts` (X-Frame-Options, nosniff, Referrer-Policy, HSTS), `/admin` закрыт в `robots.txt`.

## 3. Cloudflare (бесплатно, кликами — на стороне пользователя)
- **Bot Fight Mode** On, **WAF** managed rules, **Rate Limiting** на `/admin*`.
- **SSL/TLS → Full (Strict)**, **Always Use HTTPS** On, **HSTS** On.
- Сильнейшее: **Zero Trust → Access** на `/admin` (email-код).

## 4. Данные / 152-ФЗ
- Лиды на проде эфемерны (база в контейнере) — выгружать или вынести в постоянную БД (Volume/Neon).
- Форма заявки: чекбокс согласия на ПДн + страница `/privacy`; реквизиты оператора в `privacy/page.tsx` заполнить.
- Дисклеймеры (не ИИР, риски) — заметны.

## 5. Отчёт
Чётко раздели: что **я закрыл кодом** (пуш), и что **на стороне пользователя** (Railway Variables, Cloudflare-тумблеры) — с точными шагами.
