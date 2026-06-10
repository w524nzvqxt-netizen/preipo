"use client";

// Форма сделки с каскадом «компания → раунд» и живым расчётом.
// У каждого раунда — оценка и цена акции (для публичных выводится из текущей
// цены: цена_раунда = оценка_раунда × текущая_цена ÷ текущая_капитализация).
// Мультипликатор = капитализация сейчас ÷ оценка раунда → прогноз прибыли
// клиента, SF (20% прибыли) и заработок партнёра (¼ SF).
import { useMemo, useState } from "react";
import { addSale, updateSale } from "@/app/agent/actions";
import { formatMoney, formatPrice } from "@/lib/format";
import type { CompanyOption } from "@/lib/agent-companies";

export type SaleInitial = {
  id: string;
  companyName: string;
  round: string | null;
  amount: number;
  pricePerUnit: number | null;
  yearsToExit: number | null;
  currency: string;
  commissionPaid: boolean;
  note: string | null;
};

const input =
  "w-full rounded-control border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none";

export function SaleForm({
  clientId,
  companies,
  initial,
}: {
  clientId: string;
  companies: CompanyOption[];
  initial?: SaleInitial;
}) {
  const editing = !!initial;
  const initCompany = companies.find((c) => c.name === (initial?.companyName ?? ""));
  const initRoundIdx =
    initial?.round && initCompany ? initCompany.rounds.findIndex((r) => r.round === initial.round) : -1;

  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [roundIdx, setRoundIdx] = useState(initRoundIdx);
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [sharePrice, setSharePrice] = useState(initial?.pricePerUnit != null ? String(initial.pricePerUnit) : "");
  const [years, setYears] = useState(initial?.yearsToExit != null ? String(initial.yearsToExit) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");

  const LOCKUP = 0.5; // лок-ап после IPO, лет
  const nowD = new Date();
  const nowYear = nowD.getFullYear() + nowD.getMonth() / 12;

  const company = useMemo(() => companies.find((c) => c.name === companyName), [companies, companyName]);
  const rounds = company?.rounds ?? [];
  const round = roundIdx >= 0 ? rounds[roundIdx] : undefined;

  const mult =
    company?.marketCap && round?.valuationUSD && round.valuationUSD > 0
      ? company.marketCap / round.valuationUSD
      : null;

  const amt = parseFloat(amount.replace(",", ".")) || 0;
  const price = parseFloat(sharePrice.replace(",", ".")) || 0;
  const gross = mult ? amt * Math.max(0, mult - 1) : 0;
  const entryFee = amt * 0.05; // вход 5% от суммы
  const sf = gross * 0.2; // success fee 20% прибыли
  const partner = entryFee + sf / 4; // партнёр: вход + ¼ SF
  const clientNet = gross - sf - entryFee; // заработок клиента за вычетом сборов
  const shares = price > 0 ? amt / price : 0;
  const yrs = parseFloat(years.replace(",", ".")) || 0;
  // рентабельность агента: комиссии ÷ сумма инвестиции ÷ годы до выхода
  const agentYield = yrs > 0 && amt > 0 ? (partner / amt / yrs) * 100 : 0;

  function pickRound(i: number) {
    setRoundIdx(i);
    const r = rounds[i];
    setSharePrice(r?.sharePrice != null ? String(Math.round(r.sharePrice * 100) / 100) : "");
    // срок удержания = год выхода − год раунда + лок-ап (для проектов год раунда ≈ сейчас)
    const roundYear = r?.year ?? nowYear;
    const y = company?.exitYear != null ? Math.max(LOCKUP, company.exitYear - roundYear + LOCKUP) : null;
    setYears(y != null ? String(Math.round(y * 10) / 10) : "");
  }

  return (
    <form action={editing ? updateSale : addSale} className="rounded-card border border-border bg-surface p-5">
      <input type="hidden" name="clientId" value={clientId} />
      {editing && <input type="hidden" name="saleId" value={initial!.id} />}
      <input type="hidden" name="companyName" value={companyName} />
      <input type="hidden" name="round" value={round?.round ?? ""} />
      <input type="hidden" name="expMultiple" value={mult ? mult.toFixed(2) : ""} />
      <input type="hidden" name="pricePerUnit" value={sharePrice} />
      <input type="hidden" name="currency" value={currency} />

      <p className="kicker mb-3 text-text-muted">{editing ? "Редактировать сделку" : "Новая сделка"}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value);
            setRoundIdx(-1);
            setSharePrice("");
            setYears("");
          }}
          required
          className={input}
        >
          <option value="" disabled>Компания *</option>
          {companies.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>

        <select
          value={roundIdx}
          onChange={(e) => pickRound(Number(e.target.value))}
          disabled={!company || rounds.length === 0}
          className={input}
        >
          <option value={-1} disabled>{rounds.length ? "Раунд входа" : "— нет раундов —"}</option>
          {rounds.map((r, i) => (
            <option key={i} value={i}>
              {r.round}{r.year ? ` · ${r.year}` : ""}
              {r.valuationUSD ? ` · оценка ${formatMoney(r.valuationUSD)}` : ""}
              {r.sharePrice ? ` · ${formatPrice(r.sharePrice)}/акц` : ""}
            </option>
          ))}
        </select>

        <input
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Сумма инвестиции *"
          required
          className={input}
        />

        <input
          value={sharePrice}
          onChange={(e) => setSharePrice(e.target.value)}
          inputMode="decimal"
          placeholder="Цена акции"
          className={input}
        />

        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={input}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="RUB">RUB</option>
          <option value="AED">AED</option>
        </select>

        <input
          value={years}
          onChange={(e) => setYears(e.target.value)}
          name="yearsToExit"
          inputMode="decimal"
          placeholder="Лет до выхода (IPO+лок-ап)"
          className={input}
        />

        <input name="note" placeholder="Комментарий" defaultValue={initial?.note ?? ""} className={`${input} lg:col-span-2`} />
      </div>

      {/* Живой расчёт */}
      {mult && amt > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          <Cell label="Мультипликатор" value={`${mult.toFixed(2).replace(".", ",")}×`} />
          <Cell label="Заработок клиента" value={formatPrice(clientNet, currency)} cls="text-positive" />
          <Cell label="Вход 5%" value={formatPrice(entryFee, currency)} cls="text-warning" />
          <Cell label="SF агента (¼)" value={formatPrice(sf / 4, currency)} cls="text-accent" />
          <Cell label="Партнёр (вход+¼SF)" value={formatPrice(partner, currency)} cls="text-brand" />
          <Cell label="Рентаб. агента" value={agentYield > 0 ? `${agentYield.toFixed(1).replace(".", ",")}%/год` : "—"} cls="text-positive" />
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-muted">
          Выберите компанию, раунд входа и сумму — рассчитаю прибыль клиента, SF (20%) и ваш заработок (¼ SF).
        </p>
      )}
      {shares > 0 && (
        <p className="mt-2 text-xs text-text-muted">≈ {Math.round(shares).toLocaleString("ru-RU")} акций по {formatPrice(price, currency)}</p>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" name="commissionPaid" defaultChecked={initial?.commissionPaid} className="h-4 w-4 accent-brand" />
        Выплата партнёру произведена
      </label>
      <button className="mt-3 rounded-control bg-brand px-5 py-2 text-sm font-semibold text-bg transition-all hover:brightness-110">
        {editing ? "Сохранить изменения" : "Добавить сделку"}
      </button>
    </form>
  );
}

function Cell({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="bg-surface p-3">
      <p className="kicker text-text-muted">{label}</p>
      <p className={`nums mt-1 font-bold ${cls ?? "text-text-primary"}`}>{value}</p>
    </div>
  );
}
