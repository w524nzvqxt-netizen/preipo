# pre-ipo.pro — правки для доработки

**Цель:** превратить красивый лендинг в инструмент, который собирает заявки.
**Дата аудита:** 2026-06-08. **Что тестировалось:** десктоп 1440px + мобильный 390px (эмуляция), Lighthouse, Core Web Vitals, разбор DOM.

**Стек (определён по сайту, проверь на месте):** React + Vite (SPA, один `index.html`), Tailwind с кастомными токенами (`text-text-muted`, `text-brand`, `rounded-control`, `kicker`, `nums`, `full-bleed grain`), плавный скролл **Lenis**, 2×`<canvas>` (созвездие + свечной график), видео `/uploads/main-pre-ipo.mp4`.

**Что НЕ трогаем (уже хорошо):** Lighthouse A11y 96 / BestPractices 100 / SEO 100, CLS 0.00, LCP 2.19s. Айдентика, типографика, карточки трек-рекорда, конструктор портфеля — это сильные стороны, их сохраняем и усиливаем.

---

## Сводная таблица задач

| ID | Задача | Приоритет | ~Время | Где |
|----|--------|-----------|--------|-----|
| 1 | OG-теги + превью-картинка для мессенджеров | 🔴 P0 | 1–2 ч | `index.html` + 1 картинка |
| 2 | Мобильный хедер с бургер-меню | 🔴 P0 | 2–4 ч | `Header.tsx` |
| 3 | Первый экран: статичный заголовок + CTA без скролла | 🔴 P0 | 3–5 ч | `Hero.tsx` |
| 4 | Контраст: Telegram-кнопка + кикеры | 🔴 P0 | 30 мин | токены/кнопка |
| 5 | Блок «×12,7 vs S&P 500» на главную под hero | 🟠 P1 | 3–5 ч | новая секция |
| 6 | Указать порог входа «от $___» | 🟠 P1 | 30 мин | hero/FAQ |
| 7 | Слой доверия: логотипы, юрлицо, лицо, процесс | 🟠 P1 | 1–2 дня | контент |
| 8 | Единая дизайн-система (тёмная тема на всех страницах) | 🟡 P2 | 1 день | `/portfolio`, `/exits` |
| 9 | Reduced-motion + базовая видимость контента | 🟡 P2 | 2–3 ч | Lenis init + reveal |

**Рекомендуемый порядок:** 1 → 4 → 6 → 2 → 3 → 5 → 9 → 7 → 8.
Задачи 1, 4, 6 — это считанные строки и максимальный эффект на заявки. Делать первыми.

---

## 🔴 P0-1. OG-теги + превью при шеринге

**Проблема:** тегов `og:image` / `og:title` / `og:description` нет вообще. Ссылку пересылают в Telegram/WhatsApp → серый прямоугольник без картинки. Это режет клики в главном канале трафика.

**Что сделать:** в `<head>` файла `index.html` добавить блок (подставь реальный домен и путь к картинке):

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:locale" content="ru_RU" />
<meta property="og:site_name" content="Pre-IPO Витрина" />
<meta property="og:title" content="Инвестируйте в гигантов до IPO" />
<meta property="og:description" content="Доступ к долям в зрелых частных компаниях до выхода на биржу. Трек-рекорд ×12,7 против S&P 500 ×2,1. Отобранные сделки и аналитика." />
<meta property="og:url" content="https://pre-ipo.pro/" />
<meta property="og:image" content="https://pre-ipo.pro/og-cover.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Инвестируйте в гигантов до IPO" />
<meta name="twitter:description" content="Доступ к долям в частных компаниях до IPO. Трек-рекорд ×12,7 vs S&P 500." />
<meta name="twitter:image" content="https://pre-ipo.pro/og-cover.jpg" />
```

**Картинку** `og-cover.jpg` 1200×630 положить в `public/`. На ней: тёмный фон в стиле сайта + заголовок «Инвестируйте в гигантов до IPO» + крупно «×12,7 vs S&P 500» + лого. (Могу сгенерировать — см. конец файла.)

**Готово, когда:** вставка ссылки https://pre-ipo.pro/ в Telegram показывает карточку с картинкой и заголовком. Проверка: https://www.opengraph.xyz/ или просто кинуть ссылку себе в Telegram.

---

## 🔴 P0-2. Мобильный хедер сломан

**Проблема:** на ширине <640px логотип переносится в две строки, контакт-кнопки налезают, а ссылки «Уже на бирже» и «Конструктор портфеля» исчезают (`hidden ... sm:block`) — **бургер-меню нет**, поэтому `/portfolio` и `/exits` недоступны с телефона. А телефон — основной трафик из мессенджеров.

**Что сделать:** добавить бургер с выезжающим меню. Пример (React + Tailwind, адаптируй под свои классы):

```tsx
import { useState } from "react";

const NAV = [
  { href: "/exits", label: "Уже на бирже" },
  { href: "/portfolio", label: "Конструктор портфеля" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#070b0e]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 whitespace-nowrap text-lg font-semibold">
          <span className="text-brand">◆</span> Pre-IPO
        </a>

        {/* десктоп */}
        <nav className="hidden items-center gap-5 sm:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-text-secondary hover:text-brand">
              {n.label}
            </a>
          ))}
          <a href="https://t.me/twix43" className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-[#06120d]">
            Telegram
          </a>
        </nav>

        {/* бургер — только мобайл */}
        <button
          className="sm:hidden p-2 -mr-2"
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-white mb-1.5" />
          <span className="block h-0.5 w-6 bg-white mb-1.5" />
          <span className="block h-0.5 w-6 bg-white" />
        </button>
      </div>

      {/* мобильное меню */}
      {open && (
        <nav className="sm:hidden border-t border-white/10 bg-[#070b0e] px-4 py-4 space-y-3">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="block py-2 text-base text-text-secondary" onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <a href="https://t.me/twix43" className="flex-1 rounded-control bg-brand py-3 text-center font-semibold text-[#06120d]">Telegram</a>
            <a href="#" className="flex-1 rounded-control border border-white/15 py-3 text-center">WhatsApp</a>
            <a href="#" className="flex-1 rounded-control border border-white/15 py-3 text-center">Email</a>
          </div>
        </nav>
      )}
    </header>
  );
}
```

**Готово, когда:** на 360–414px логотип в одну строку, виден бургер, по тапу открывается меню со всеми ссылками и контактами; `/portfolio` и `/exits` доступны с телефона.

---

## 🔴 P0-3. Первый экран не продаёт

**Проблема:** заголовок в коде правильный («Инвестируйте в гигантов до IPO»), но он анимируется по словам и схлопывается в гигантское «IPO» — главный посыл теряется. УТП-абзац и кнопки видны только после скролла. Кикер «PRE-IPO · ДОСТУП ДО БИРЖИ» почти нечитаем (контраст 4.18).

**Что сделать:**
1. Заголовок **всегда читается целиком**. Если оставляешь анимацию — анимируй прозрачность всей строки один раз при загрузке (с уважением к `prefers-reduced-motion`), а не пословный реверс, который заканчивается на «IPO».
2. В первом экране без скролла должны быть: заголовок + подзаголовок + **один** главный CTA + одна строка доказательства.

```tsx
<section className="full-bleed grain relative flex min-h-[100svh] items-center">
  <div className="mx-auto w-full max-w-6xl px-4">
    <p className="kicker mb-4 text-brand">PRE-IPO · ДОСТУП ДО БИРЖИ</p>

    <h1 className="max-w-3xl text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.05]">
      Инвестируйте в гигантов <span className="text-brand">до IPO</span>
    </h1>

    <p className="mt-6 max-w-xl text-lg text-text-secondary">
      Доступ к долям в зрелых частных компаниях до выхода на биржу.
      Отобранные сделки, аналитика и сценарии — войдите раньше всех.
    </p>

    {/* строка доказательства прямо в hero */}
    <p className="mt-4 text-sm text-text-secondary">
      Трек-рекорд рынка: <span className="font-semibold text-brand">×12,7</span> против S&P 500 ×2,1 · 21 компания от раунда до IPO
    </p>

    <div className="mt-8 flex flex-wrap gap-3">
      <a href="#projects" className="rounded-control bg-brand px-7 py-4 text-base font-semibold text-[#06120d]">
        Смотреть проекты
      </a>
      <a href="#how" className="rounded-control border border-white/15 px-7 py-4 text-base">
        Как это работает
      </a>
    </div>
    <p className="mt-3 text-sm text-text-muted">Минимальный чек — от $____ · ответим в Telegram за 15 минут</p>
  </div>
</section>
```

**Готово, когда:** на первом экране (без скролла, и на десктопе, и на мобайле) видны: понятный заголовок, подзаголовок, кнопка и строка про ×12,7. Никакого «IPO» вместо заголовка.

---

## 🔴 P0-4. Контраст (читаемость CTA и подписей)

**Проблема (по Lighthouse):**
- Кнопка **Telegram**: белый текст `#ffffff` на зелёном `#27e0a8` = контраст **1.7** (почти нечитаемо).
- Кикеры (`.kicker`, «ВИТРИНА», «ТРЕК-РЕКОРД»): `#6b7a85` = **4.18–4.46** (ниже нормы 4.5).

**Что сделать:**
- Текст на зелёных кнопках сделать тёмным (как у кнопки «Смотреть проекты»): `color: #06120d` на `#27e0a8` → контраст ~9:1.
- Цвет кикеров поднять: `--color-text-muted` с `#6b7a85` до примерно `#94a3b0` (проверить, что на фоне `#070b0e` выходит ≥ 4.5).

```css
/* было: --color-text-muted: #6b7a85;  (контраст 4.18) */
:root { --color-text-muted: #94a3b0; } /* проверить инструментом, цель ≥ 4.5 */

.btn-brand { background:#27e0a8; color:#06120d; } /* не белый текст */
```

Гигантские номера секций «01–04» (`#2a3a47`, контраст 1.68) — это декор, можно оставить, но добавить им `aria-hidden="true"`, чтобы скринридеры их не читали и Lighthouse не ругался.

**Готово, когда:** Lighthouse → Accessibility → «color-contrast» без ошибок (или остаются только `aria-hidden` декоративные номера).

---

## 🟠 P1-5. Главное доказательство — на главную

**Проблема:** график «$950 тыс → $12 млн (×12,7) против $2 млн в S&P 500» на `/exits` — это самый убедительный аргумент на сайте. Сейчас он: на отдельной странице, недоступен с мобайла, в другой (светлой) теме.

**Что сделать:** вынести компактную версию на главную, сразу под hero: крупное число + мини-график + кнопка «Смотреть трек-рекорд → /exits». Переиспользовать данные/компонент графика с `/exits`, перекрасить под тёмную тему.

```tsx
<section id="proof" className="mx-auto max-w-6xl px-4 py-20">
  <p className="kicker text-brand">ТРЕК-РЕКОРД РЫНКА · 21 КОМПАНИЯ ОТ РАУНДА ДО IPO</p>
  <div className="mt-4 grid gap-8 md:grid-cols-2 md:items-center">
    <div>
      <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-tight">
        $10 тыс в каждый раунд → <span className="text-brand">×12,7</span>
      </h2>
      <p className="mt-4 text-text-secondary">
        Pre-IPO раунды известных компаний (и взлёты, и провалы) опередили бы S&P 500 примерно в 6,1×.
        Разбивка по раундам, цена акций и калькулятор по точке входа.
      </p>
      <a href="/exits" className="mt-6 inline-block rounded-control bg-brand px-6 py-3 font-semibold text-[#06120d]">
        Смотреть трек-рекорд →
      </a>
    </div>
    {/* сюда мини-версия графика из /exits (тёмная тема) */}
    <div className="rounded-2xl border border-white/10 p-4">{/* <TrackRecordChart compact /> */}</div>
  </div>
</section>
```

**Готово, когда:** доказательство ×12,7 видно на главной без перехода на подстраницу, в т.ч. на мобайле.

---

## 🟠 P1-6. Порог входа

**Проблема:** в meta-описании обещан «минимальный чек», но **на сайте суммы входа нет нигде**. Вопрос №1 инвестора («сколько нужно?») без ответа.

**Что сделать:** добавить «Минимальный чек — от $____» в hero (см. P0-3) и отдельной строкой в блоке заявки/FAQ. Подставить реальную цифру.

**Готово, когда:** порог входа явно указан минимум в двух местах (hero + форма/FAQ).

---

## 🟠 P1-7. Слой доверия (для крупных чеков критично)

**Проблема:** на странице `imgCount: 0` — ноль изображений. Нет логотипов компаний, лиц, команды, процесса, юрлица, регуляторного статуса. Для оффера, где заносят большие деньги в неликвид, «безликий» сайт = риск в голове клиента.

**Что добавить (контент):**
- Реальные логотипы компаний витрины (Anthropic, OpenAI, Stripe и т.д.) — сейчас только текст.
- Блок «Как мы отбираем сделки» / «Как проходит вход» (3–4 шага).
- Кто принимает заявку: имя/лицо/должность, на кого оформляется сделка (юр-лицо), регуляторный статус.
- 1–2 реальных кейса входа/выхода с цифрами.

**Готово, когда:** на главной есть хотя бы один реальный человек/имя, юр-лицо и логотипы компаний.

---

## 🟡 P2-8. Единая дизайн-система

**Проблема:** главная тёмная, `/portfolio` и `/exits` — светлые кремовые, лого меняется («◆ Pre-IPO» → «Pre-IPO Витрина»). Ощущение трёх разных сайтов.

**Что сделать:** общий набор токенов (цвет/типографика/радиусы) в одном месте, один логотип, одна тема. Привести `/portfolio` и `/exits` к тёмной теме главной (или осознанно сделать единый light/dark на всех страницах).

**Готово, когда:** переходы главная ↔ /portfolio ↔ /exits ощущаются как один продукт; лого одинаковое.

---

## 🟡 P2-9. Reduced-motion и видимость контента

**Проблема:** Lenis перехватывает скролл; контент ниже hero — `opacity:0` до въезда в вид (на быстром скролле «пропадает-появляется»). Render-delay hero ~1.9s из-за canvas-анимаций.

**Что сделать:**
- Инициализировать Lenis и анимации только если движение разрешено:

```ts
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduce) {
  const lenis = new Lenis();
  requestAnimationFrame(function raf(t){ lenis.raf(t); requestAnimationFrame(raf); });
}
```

- Reveal-анимации делать «прогрессивным улучшением»: базовое состояние — `opacity:1`, а класс скрытия навешивать через JS только при включённой анимации. Тогда при отключённом/неуспевшем JS контент виден.
- Canvas-анимации (созвездие/свечи) ставить на паузу при `prefers-reduced-motion` и вне вьюпорта (IntersectionObserver).

**Готово, когда:** при включённом «уменьшить движение» в системе страница статична и полностью читаема; контент не пропадает на быстром скролле.

---

## Финальный QA-чек-лист (перед публикацией)

- [ ] Ширины 320 / 375 / 768 / 1024 / 1440 — нет горизонтального скролла, хедер и hero не ломаются.
- [ ] С телефона доступны `/portfolio` и `/exits` (бургер).
- [ ] Ссылка в Telegram показывает превью-карточку (OG).
- [ ] Lighthouse (mobile): Accessibility без ошибок контраста; Performance не упал.
- [ ] Первый экран без скролла отвечает: что это / зачем / что нажать / порог входа.
- [ ] Главная содержит доказательство ×12,7 и хотя бы один элемент доверия.
- [ ] `prefers-reduced-motion`: страница читаема и статична.

---

## Доступно по запросу (могу подготовить отдельно)
- Превью-картинку `og-cover.jpg` 1200×630 под P0-1.
- Визуальный макет нового первого экрана (концепт hero).
- Финальные продающие тексты hero / CTA / FAQ.
