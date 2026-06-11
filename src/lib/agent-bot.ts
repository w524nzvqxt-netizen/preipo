// Telegram-бот кабинета партнёра (@preipoprobot) — фабрика без запуска.
// На проде обрабатывает обновления через webhook (/api/tg/webhook) с той же БД, что и сайт.
// Локально можно запустить long-polling раннером bot-agent/index.ts.
import { scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { Bot, InlineKeyboard } from "grammy";
import type { PrismaClient } from "../generated/prisma/client";
import { portfolio, saleMetrics } from "./agent-calc";

// Секрет вебхука детерминированно выводится из токена — отдельная переменная окружения не нужна.
export function webhookSecret(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const SP500_ANNUAL = 0.1;
const LOCKUP = 0.5;

// --- утилиты ---
function verifyPassword(pw: string, stored: string): boolean {
  const [scheme, salt, hash] = (stored || "").split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const dk = scryptSync(pw, salt, 64);
  const h = Buffer.from(hash, "hex");
  return dk.length === h.length && timingSafeEqual(dk, h);
}
function fmt(v: number, cur = "USD"): string {
  const sym = cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "RUB" ? "₽" : cur + " ";
  return sym + new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Math.round(v));
}
function pctStr(v: number | null): string {
  return v != null ? `${v.toFixed(1).replace(".", ",")}%` : "—";
}
function exitDecimal(s: string | null | undefined): number | null {
  if (!s) return null;
  const ym = s.match(/(\d{4})-(\d{2})/);
  if (ym) return +ym[1] + (+ym[2] - 1) / 12;
  const y = s.match(/(\d{4})/);
  if (!y) return null;
  let month = 6;
  if (/H2|2H|3Q|4Q|Q3|Q4/i.test(s)) month = 9;
  else if (/H1|1H|1Q|2Q|Q1|Q2/i.test(s)) month = 3;
  return +y[1] + (month - 1) / 12;
}

type Round = { round: string; year: number | null; valuationUSD: number; sharePrice: number | null };
type Company = { name: string; marketCap: number | null; exitYear: number | null; rounds: Round[] };
type Sess = { step: string; data: Record<string, unknown> };

export function createAgentBot(prisma: PrismaClient, token: string): Bot {
  const bot = new Bot(token);
  const nowD = new Date();
  const NOW_YEAR = nowD.getFullYear() + nowD.getMonth() / 12;

  async function companyOptions(): Promise<Company[]> {
    const [projects, pub] = await Promise.all([
      prisma.project.findMany({
        where: { isActive: true },
        select: { name: true, stage: true, valuation: true, exitValuation: true, pricePerShare: true, expectedExit: true },
      }),
      prisma.publicCompany.findMany({ orderBy: { currentMarketCapUSD: "desc" } }),
    ]);
    const out: Company[] = [];
    const seen = new Set<string>();
    for (const pc of pub) {
      seen.add(pc.name);
      const cap = pc.currentMarketCapUSD ?? null;
      const cur = pc.currentPriceUSD ?? null;
      let rounds: Round[] = [];
      try {
        rounds = (JSON.parse(pc.rounds ?? "[]") as { round?: string; year?: number; valuationUSD?: number }[])
          .filter((r) => r && (r.valuationUSD ?? 0) > 0)
          .map((r) => ({
            round: r.round ?? "Раунд",
            year: r.year ?? null,
            valuationUSD: r.valuationUSD as number,
            sharePrice: r.valuationUSD && cur && cap ? (r.valuationUSD * cur) / cap : null,
          }));
      } catch {}
      out.push({ name: pc.name, marketCap: cap, exitYear: exitDecimal(pc.ipoDate), rounds });
    }
    for (const p of projects) {
      if (seen.has(p.name)) continue;
      out.push({
        name: p.name,
        marketCap: p.exitValuation ?? null,
        exitYear: exitDecimal(p.expectedExit),
        rounds: p.valuation
          ? [{ round: p.stage || "Вход", year: null, valuationUSD: p.valuation, sharePrice: p.pricePerShare ?? null }]
          : [],
      });
    }
    return out;
  }

  function saleCalc(amount: number, marketCap: number | null, r: Round, exitYear: number | null) {
    const mult = marketCap && r.valuationUSD ? marketCap / r.valuationUSD : 1;
    const gross = amount * Math.max(0, mult - 1);
    const entryFee = Math.round(amount * 0.05 * 100) / 100;
    const sf = Math.round(gross * 0.2 * 100) / 100;
    const partner = Math.round((sf / 4) * 100) / 100;
    const years = exitYear != null ? Math.max(LOCKUP, exitYear - (r.year ?? NOW_YEAR) + LOCKUP) : null;
    return { mult, gross, entryFee, sf, partner, years: years != null ? Math.round(years * 10) / 10 : null };
  }

  // --- сессии (диалоги) ---
  const sess = new Map<number, Sess>();

  async function agentByTg(id: number) {
    return prisma.agent.findFirst({ where: { telegramId: String(id), isActive: true } });
  }

  function mainMenu() {
    return new InlineKeyboard()
      .text("👥 Мои клиенты", "menu:clients").row()
      .text("➕ Новый клиент", "menu:addclient").row()
      .text("📊 Портфель", "menu:portfolio").row()
      .text("📄 Отчёт по портфелю", "menu:report").row()
      .text("🚪 Выйти", "menu:logout");
  }

  const PAGE = 8;
  function companyListKb(companies: Company[], page: number): InlineKeyboard {
    const total = companies.length;
    const pages = Math.max(1, Math.ceil(total / PAGE));
    const p = Math.min(Math.max(page, 0), pages - 1);
    const kb = new InlineKeyboard();
    for (let i = p * PAGE; i < Math.min(total, (p + 1) * PAGE); i++) kb.text(companies[i].name, `co:${i}`).row();
    if (p > 0) kb.text("◀", `copage:${p - 1}`);
    kb.text(`${p + 1}/${pages}`, "noop");
    if (p < pages - 1) kb.text("▶", `copage:${p + 1}`);
    return kb;
  }

  // --- старт / вход ---
  bot.command("start", async (ctx) => {
    const payload = typeof ctx.match === "string" ? ctx.match : "";
    const agent = await agentByTg(ctx.from!.id);

    // подтверждение входа на сайте по ссылке t.me/...?start=login_<code>
    if (payload.startsWith("login_")) {
      const code = payload.slice(6);
      if (!agent) {
        sess.set(ctx.from!.id, { step: "login_user", data: { pendingLogin: code } });
        return ctx.reply("Чтобы подтвердить вход на сайте, сначала войдите.\nВведите ваш логин:");
      }
      const lc = await prisma.loginCode.findUnique({ where: { code } });
      if (!lc) return ctx.reply("Код входа не найден или истёк. Запросите вход на сайте заново.");
      // Явное подтверждение (защита от фишинга/login-CSRF): не подтверждаем автоматически.
      return ctx.reply(
        "🔐 Запрошен вход на сайт в ваш кабинет партнёра.\n\n⚠️ Подтверждайте, ТОЛЬКО если это вы прямо сейчас входите в браузере. Если вход запросили не вы — отклоните.",
        {
          reply_markup: new InlineKeyboard()
            .text("✅ Это я, войти", `tgok:${code}`)
            .text("❌ Отклонить", `tgno:${code}`),
        }
      );
    }

    if (agent) return ctx.reply(`С возвращением, ${agent.name}!`, { reply_markup: mainMenu() });
    sess.set(ctx.from!.id, { step: "login_user", data: {} });
    await ctx.reply("Кабинет партнёра Pre-IPO.\nВведите ваш логин:");
  });

  bot.command("logout", async (ctx) => {
    const a = await agentByTg(ctx.from!.id);
    if (a) await prisma.agent.update({ where: { id: a.id }, data: { telegramId: null } });
    await ctx.reply("Вы вышли. /start — войти снова.");
  });

  // --- портфель ---
  async function portfolioText(agentId: string): Promise<string> {
    const sales = await prisma.sale.findMany({ where: { agentId } });
    const clients = await prisma.client.count({ where: { agentId } });
    const invested = sales.reduce((s, x) => s + x.amount, 0);
    const partner = sales.reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
    const paid = sales.filter((x) => x.commissionPaid).reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
    const yDenom = sales.reduce((s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * x.yearsToExit : 0), 0);
    const clientNetY = sales.reduce(
      (s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) - (x.sf ?? 0) - (x.entryFee ?? 0) : 0),
      0
    );
    const preIpoY = sales.reduce((s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) : 0), 0);
    const spY = sales.reduce((s, x) => {
      const y = x.yearsToExit ?? 0;
      return y > 0 ? s + x.amount * (Math.pow(1 + SP500_ANNUAL, y) - 1) : s;
    }, 0);
    const agentAnnual = yDenom > 0 ? (partner / yDenom) * 100 : null;
    const clientAnnual = yDenom > 0 ? (clientNetY / yDenom) * 100 : null;
    const preIpoAnnual = yDenom > 0 ? (preIpoY / yDenom) * 100 : null;
    const spAnnual = yDenom > 0 ? (spY / yDenom) * 100 : null;
    return (
      `📊 *Портфель*\n` +
      `Клиентов: ${clients}\n` +
      `Инвестировано: ${fmt(invested)}\n` +
      `Заработок партнёра: ${fmt(partner)} (выплачено ${fmt(paid)})\n\n` +
      `Рентабельность агента: *${pctStr(agentAnnual)}/год*\n` +
      `Чистая доходность клиента: *${pctStr(clientAnnual)}/год*\n\n` +
      `Pre-IPO: ${pctStr(preIpoAnnual)}/год vs S&P 500: ${pctStr(spAnnual)}/год`
    );
  }

  async function clientReportText(agentId: string, clientId: string): Promise<string | null> {
    const c = await prisma.client.findFirst({ where: { id: clientId, agentId }, include: { sales: { orderBy: { soldAt: "desc" } } } });
    if (!c) return null;
    const p = portfolio(c.sales);
    const lines = c.sales
      .map((s) => {
        const m = saleMetrics(s);
        return `• ${s.companyName}${s.round ? ` (${s.round})` : ""}: ${fmt(s.amount, s.currency)} → прогноз ${fmt(m.exitValue, s.currency)} (×${m.mult.toFixed(2)}), чистая прибыль ${fmt(m.clientNet, s.currency)}${s.yearsToExit ? `, ~${s.yearsToExit} лет` : ""}`;
      })
      .join("\n");
    return (
      `📄 *Отчёт инвестора*\n${c.name}${c.contact ? ` · ${c.contact}` : ""}\n\n` +
      `Инвестировано: ${fmt(p.invested)}\n` +
      `Чистая прибыль (прогноз): ${fmt(p.clientProfit)}\n` +
      `Доходность: ${pctStr(p.clientAnnual)}/год (S&P 500 ${pctStr(p.sp500Annual)}/год)\n\n` +
      `${lines || "сделок нет"}\n\n` +
      `Прогноз основан на ожидаемой оценке выхода, не гарантия. Не является индивидуальной инвестиционной рекомендацией.`
    );
  }

  async function partnerReportText(agentId: string): Promise<string> {
    const clients = await prisma.client.findMany({ where: { agentId }, include: { sales: true }, orderBy: { createdAt: "desc" } });
    const p = portfolio(clients.flatMap((c) => c.sales));
    const rows = clients
      .map((c) => {
        const cp = portfolio(c.sales);
        return `• ${c.name}: ${c.sales.length} сд. · ${fmt(cp.invested)} → партнёр ${fmt(cp.partnerTotal)} (${pctStr(cp.agentAnnual)}/год)`;
      })
      .join("\n");
    return (
      `📄 *Отчёт партнёра*\nКлиентов: ${clients.length}\n\n` +
      `Инвестировано: ${fmt(p.invested)}\n` +
      `Заработок партнёра: ${fmt(p.partnerTotal)} (выплачено ${fmt(p.partnerPaid)}, к выплате ${fmt(p.partnerUnpaid)})\n` +
      `Рентабельность: ${pctStr(p.agentAnnual)}/год · доходность клиентов ${pctStr(p.clientAnnual)}/год\n\n` +
      `${rows || "клиентов нет"}`
    );
  }

  async function clientCard(agentId: string, clientId: string): Promise<{ text: string; kb: InlineKeyboard } | null> {
    const c = await prisma.client.findFirst({ where: { id: clientId, agentId }, include: { sales: true, _count: { select: { documents: true } } } });
    if (!c) return null;
    const invested = c.sales.reduce((s, x) => s + x.amount, 0);
    const partner = c.sales.reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
    let lines = c.sales
      .map((x) => `• ${x.companyName}${x.round ? ` (${x.round})` : ""} — ${fmt(x.amount, x.currency)} → партнёр ${fmt(x.commission + (x.entryFee ?? 0), x.currency)}`)
      .join("\n");
    if (!lines) lines = "_сделок пока нет_";
    const text =
      `👤 *${c.name}*\n${c.contact || "—"}\n\n` +
      `Сделок: ${c.sales.length} · Документов: ${c._count.documents}\n` +
      `Инвестировано: ${fmt(invested)} · Заработок партнёра: ${fmt(partner)}\n\n${lines}`;
    const kb = new InlineKeyboard()
      .text("➕ Сделка", `addsale:${c.id}`).row()
      .text("📄 Отчёт клиенту", `report:${c.id}`).row()
      .text("⬅️ К клиентам", "menu:clients");
    return { text, kb };
  }

  // --- callbacks меню ---
  bot.on("callback_query:data", async (ctx) => {
    const agent = await agentByTg(ctx.from.id);
    await ctx.answerCallbackQuery().catch(() => {});
    if (!agent) return ctx.reply("Сначала войдите: /start");
    const d = ctx.callbackQuery.data;

    if (d === "menu:clients") {
      const clients = await prisma.client.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" } });
      if (clients.length === 0) return ctx.reply("Клиентов нет. Добавьте: ➕ Новый клиент", { reply_markup: mainMenu() });
      const kb = new InlineKeyboard();
      for (const c of clients) kb.text(c.name, `client:${c.id}`).row();
      return ctx.reply("Ваши клиенты:", { reply_markup: kb });
    }
    if (d === "menu:portfolio") {
      return ctx.reply(await portfolioText(agent.id), { parse_mode: "Markdown", reply_markup: mainMenu() });
    }
    if (d === "menu:report") {
      return ctx.reply(await partnerReportText(agent.id), { parse_mode: "Markdown" });
    }
    if (d.startsWith("report:")) {
      const txt = await clientReportText(agent.id, d.slice(7));
      if (!txt) return ctx.reply("Клиент не найден.");
      return ctx.reply(txt, { parse_mode: "Markdown" });
    }
    if (d.startsWith("tgok:")) {
      const code = d.slice(5);
      const lc = await prisma.loginCode.findUnique({ where: { code } });
      if (!lc) return ctx.reply("Код истёк. Запросите вход на сайте заново.");
      await prisma.loginCode.update({ where: { code }, data: { agentId: agent.id } });
      return ctx.reply("✅ Вход на сайте подтверждён. Вернитесь в браузер.");
    }
    if (d.startsWith("tgno:")) {
      await prisma.loginCode.delete({ where: { code: d.slice(5) } }).catch(() => {});
      return ctx.reply("Вход отклонён.");
    }
    if (d === "menu:addclient") {
      sess.set(ctx.from.id, { step: "client_name", data: {} });
      return ctx.reply("Имя нового клиента:");
    }
    if (d === "menu:logout") {
      await prisma.agent.update({ where: { id: agent.id }, data: { telegramId: null } });
      return ctx.reply("Вы вышли. /start — войти снова.");
    }
    if (d.startsWith("client:")) {
      const card = await clientCard(agent.id, d.slice(7));
      if (!card) return ctx.reply("Клиент не найден.");
      return ctx.reply(card.text, { parse_mode: "Markdown", reply_markup: card.kb });
    }
    if (d.startsWith("addsale:")) {
      const clientId = d.slice(8);
      const client = await prisma.client.findFirst({ where: { id: clientId, agentId: agent.id } });
      if (!client) return ctx.reply("Клиент не найден.");
      sess.set(ctx.from.id, { step: "sale_pick", data: { clientId } });
      const companies = (await companyOptions()).filter((c) => c.rounds.length > 0);
      return ctx.reply("Выберите компанию (или напишите название для поиска):", { reply_markup: companyListKb(companies, 0) });
    }
    if (d === "noop") return;
    if (d.startsWith("copage:")) {
      const sse = sess.get(ctx.from.id);
      if (!sse || sse.step !== "sale_pick") return;
      const companies = (await companyOptions()).filter((c) => c.rounds.length > 0);
      return ctx.editMessageReplyMarkup({ reply_markup: companyListKb(companies, Number(d.slice(7))) }).catch(() => {});
    }
    if (d.startsWith("co:")) {
      const sse = sess.get(ctx.from.id);
      if (!sse || sse.step !== "sale_pick") return;
      const companies = (await companyOptions()).filter((c) => c.rounds.length > 0);
      const c = companies[Number(d.slice(3))];
      if (!c) return;
      return showRounds(ctx, sse, c);
    }
    if (d.startsWith("pickco:")) {
      const sse = sess.get(ctx.from.id);
      if (!sse || sse.step !== "sale_pickco") return;
      const cands = sse.data.candidates as Company[];
      const c = cands[Number(d.slice(7))];
      if (!c) return;
      return showRounds(ctx, sse, c);
    }
    if (d.startsWith("round:")) {
      const idx = Number(d.slice(6));
      const s = sess.get(ctx.from.id);
      if (!s || s.step !== "sale_round") return;
      const company = s.data.company as Company;
      const r = company.rounds[idx];
      if (!r) return ctx.reply("Раунд не найден.");
      s.data.round = r;
      s.step = "sale_amount";
      const sp = r.sharePrice ? ` · ${fmt(r.sharePrice)}/акц` : "";
      return ctx.reply(`Раунд: ${r.round}${r.year ? ` ${r.year}` : ""} (оценка ${fmt(r.valuationUSD)}${sp})\nВведите сумму инвестиции клиента (USD):`);
    }
  });

  // --- текстовые шаги диалогов ---
  bot.on("message:text", async (ctx) => {
    const id = ctx.from!.id;
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return; // команды обрабатываются выше
    const s = sess.get(id);
    if (!s) {
      const agent = await agentByTg(id);
      if (agent) return ctx.reply("Меню:", { reply_markup: mainMenu() });
      return ctx.reply("Войдите: /start");
    }

    // вход
    if (s.step === "login_user") {
      s.data.username = text.toLowerCase();
      s.step = "login_pass";
      return ctx.reply("Пароль:");
    }
    if (s.step === "login_pass") {
      const pending = s.data.pendingLogin as string | undefined;
      const agent = await prisma.agent.findUnique({ where: { username: String(s.data.username) } });
      const ok = agent && agent.isActive && verifyPassword(text, agent.passwordHash);
      sess.delete(id);
      if (!ok || !agent) return ctx.reply("Неверный логин или пароль. /start — попробовать снова.");
      // привязываем Telegram к агенту (сбросив прежнюю привязку этого tg)
      await prisma.agent.updateMany({ where: { telegramId: String(id) }, data: { telegramId: null } });
      await prisma.agent.update({ where: { id: agent.id }, data: { telegramId: String(id) } });
      if (pending) {
        await ctx.reply(
          "🔐 Подтвердите вход на сайт — только если это вы прямо сейчас входите в браузере.",
          {
            reply_markup: new InlineKeyboard()
              .text("✅ Это я, войти", `tgok:${pending}`)
              .text("❌ Отклонить", `tgno:${pending}`),
          }
        );
      }
      return ctx.reply(`Готово, ${agent.name}! Совет: удалите сообщение с паролем.`, { reply_markup: mainMenu() });
    }

    const agent = await agentByTg(id);
    if (!agent) return ctx.reply("Войдите: /start");

    // новый клиент
    if (s.step === "client_name") {
      s.data.name = text;
      s.step = "client_contact";
      return ctx.reply("Контакт (телефон / email / @tg), или «-» чтобы пропустить:");
    }
    if (s.step === "client_contact") {
      await prisma.client.create({ data: { agentId: agent.id, name: String(s.data.name), contact: text === "-" ? null : text } });
      sess.delete(id);
      return ctx.reply(`Клиент «${s.data.name}» добавлен.`, { reply_markup: mainMenu() });
    }

    // сделка: компания (поиск текстом)
    if (s.step === "sale_pick" || s.step === "sale_company") {
      const all = await companyOptions();
      const q = text.toLowerCase();
      const matches = all.filter((c) => c.name.toLowerCase().includes(q) && c.rounds.length > 0).slice(0, 8);
      if (matches.length === 0) return ctx.reply("Не нашёл компанию с раундами. Попробуйте другое название:");
      if (matches.length > 1) {
        const kb = new InlineKeyboard();
        s.data.candidates = matches;
        for (let i = 0; i < matches.length; i++) kb.text(matches[i].name, `pickco:${i}`).row();
        s.step = "sale_pickco";
        return ctx.reply("Уточните компанию:", { reply_markup: kb });
      }
      return showRounds(ctx, s, matches[0]);
    }
    if (s.step === "sale_amount") {
      const amount = parseFloat(text.replace(/[^\d.,]/g, "").replace(",", "."));
      if (!Number.isFinite(amount) || amount <= 0) return ctx.reply("Введите сумму числом, например 100000:");
      const company = s.data.company as Company;
      const r = s.data.round as Round;
      const calc = saleCalc(amount, company.marketCap, r, company.exitYear);
      await prisma.sale.create({
        data: {
          agentId: agent.id,
          clientId: String(s.data.clientId),
          companyName: company.name,
          round: r.round,
          expMultiple: Math.round(calc.mult * 100) / 100,
          yearsToExit: calc.years,
          amount,
          pricePerUnit: r.sharePrice ?? null,
          currency: "USD",
          entryFee: calc.entryFee,
          commission: calc.partner,
          sf: calc.sf,
        },
      });
      sess.delete(id);
      const clientNet = calc.gross - calc.sf - calc.entryFee;
      const rent = calc.years && calc.years > 0 ? ((calc.partner + calc.entryFee) / amount / calc.years) * 100 : null;
      return ctx.reply(
        `✅ Сделка добавлена\n\n` +
          `${company.name} · ${r.round}\n` +
          `Сумма: ${fmt(amount)} · ×${calc.mult.toFixed(2)} · ~${calc.years} лет\n` +
          `Заработок клиента: ${fmt(clientNet)}\n` +
          `Вход 5%: ${fmt(calc.entryFee)} · SF агента: ${fmt(calc.partner)}\n` +
          `Заработок партнёра: ${fmt(calc.partner + calc.entryFee)} · рентаб. ${pctStr(rent)}/год`,
        { reply_markup: new InlineKeyboard().text("⬅️ К клиенту", `client:${s.data.clientId}`) }
      );
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function showRounds(ctx: any, s: Sess, company: Company) {
    s.data.company = company;
    s.step = "sale_round";
    const kb = new InlineKeyboard();
    company.rounds.forEach((r, i) => {
      const sp = r.sharePrice ? ` · ${fmt(r.sharePrice)}/акц` : "";
      kb.text(`${r.round}${r.year ? ` ${r.year}` : ""} · ${fmt(r.valuationUSD)}${sp}`, `round:${i}`).row();
    });
    return ctx.reply(`${company.name} — выберите раунд входа:`, { reply_markup: kb });
  }

  bot.catch((err) => console.error("Agent bot error:", err));
  return bot;
}
