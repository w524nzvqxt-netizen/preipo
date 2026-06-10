// Карточка клиента: что и сколько продано, комиссии (выплачено/нет), документы/видео.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSize, formatDate } from "@/lib/format";
import {
  toggleCommissionPaid,
  deleteSale,
  uploadDocument,
  deleteDocument,
} from "../../../actions";
import { SaleForm } from "@/components/agent/SaleForm";
import { getCompanyOptions } from "@/lib/agent-companies";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-control border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, agentId: agent.id }, // изоляция: только свой клиент
    include: {
      sales: { orderBy: { soldAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) notFound();

  const companyOptions = await getCompanyOptions();

  const invested = client.sales.reduce((s, x) => s + x.amount, 0);
  const sfAgentTotal = client.sales.reduce((s, x) => s + x.commission, 0); // доля агента в SF (¼)
  const entryTotal = client.sales.reduce((s, x) => s + (x.entryFee ?? 0), 0);
  // заработок партнёра = вход 5% + ¼ SF
  const partnerTotal = client.sales.reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
  const partnerPaid = client.sales
    .filter((x) => x.commissionPaid)
    .reduce((s, x) => s + x.commission + (x.entryFee ?? 0), 0);
  // заработок клиента (нетто) = валовая прибыль − SF − вход
  const clientProfit = client.sales.reduce(
    (s, x) => s + (x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) - (x.sf ?? 0) - (x.entryFee ?? 0)),
    0
  );
  // рентабельность агента: Σ комиссий ÷ Σ(инвестиция × годы до выхода)
  const yDenom = client.sales.reduce((s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * x.yearsToExit : 0), 0);
  const yNum = client.sales.reduce(
    (s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.commission + (x.entryFee ?? 0) : 0),
    0
  );
  const agentYield = yDenom > 0 ? (yNum / yDenom) * 100 : null;
  // чистая доходность клиента на портфель: среднегодовая (взвеш. по сумме×годы)
  const clientProfitY = client.sales.reduce(
    (s, x) =>
      s + (x.yearsToExit && x.yearsToExit > 0
        ? x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) - (x.sf ?? 0) - (x.entryFee ?? 0)
        : 0),
    0
  );
  const clientAnnual = yDenom > 0 ? (clientProfitY / yDenom) * 100 : null;
  // Валовая доходность pre-IPO и S&P 500 за тот же горизонт (без комиссий)
  const SP500_ANNUAL = 0.1;
  const preIpoGrossY = client.sales.reduce(
    (s, x) => s + (x.yearsToExit && x.yearsToExit > 0 ? x.amount * Math.max(0, (x.expMultiple ?? 1) - 1) : 0),
    0
  );
  const sp500GrossY = client.sales.reduce((s, x) => {
    const y = x.yearsToExit ?? 0;
    return y > 0 ? s + x.amount * (Math.pow(1 + SP500_ANNUAL, y) - 1) : s;
  }, 0);
  const preIpoAnnual = yDenom > 0 ? (preIpoGrossY / yDenom) * 100 : null;
  const sp500Annual = yDenom > 0 ? (sp500GrossY / yDenom) * 100 : null;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Link href="/agent" className="text-sm text-text-muted transition-colors hover:text-brand">
            ← Все клиенты
          </Link>
          <Link
            href={`/agent/clients/${id}/report`}
            className="rounded-control border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand"
          >
            📄 Отчёт клиенту
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
            <p className="text-sm text-text-muted">{client.contact || "—"}{client.notes ? ` · ${client.notes}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-right">
            <div><p className="kicker text-text-muted">Инвестировано</p><p className="nums font-bold text-text-primary">{formatPrice(invested)}</p></div>
            <div><p className="kicker text-text-muted">Заработок клиента</p><p className="nums font-bold text-positive">{formatPrice(clientProfit)}</p></div>
            <div><p className="kicker text-text-muted">Доходность клиента</p><p className="nums font-bold text-positive">{clientAnnual != null ? `${clientAnnual.toFixed(1).replace(".", ",")}%/год` : "—"}</p></div>
            <div><p className="kicker text-text-muted">Pre-IPO дох.</p><p className="nums font-bold text-positive">{preIpoAnnual != null ? `${preIpoAnnual.toFixed(1).replace(".", ",")}%/год` : "—"}</p></div>
            <div><p className="kicker text-text-muted">S&amp;P 500</p><p className="nums font-bold text-text-secondary">{sp500Annual != null ? `${sp500Annual.toFixed(1).replace(".", ",")}%/год` : "—"}</p></div>
            <div><p className="kicker text-text-muted">Вход 5%</p><p className="nums font-bold text-warning">{formatPrice(entryTotal)}</p></div>
            <div><p className="kicker text-text-muted">SF агента</p><p className="nums font-bold text-accent">{formatPrice(sfAgentTotal)}</p></div>
            <div><p className="kicker text-text-muted">Заработок партнёра</p><p className="nums font-bold text-brand">{formatPrice(partnerTotal)}</p></div>
            <div><p className="kicker text-text-muted">Рентаб. агента</p><p className="nums font-bold text-positive">{agentYield != null ? `${agentYield.toFixed(1).replace(".", ",")}%/год` : "—"}</p></div>
            <div><p className="kicker text-text-muted">Выплачено</p><p className="nums font-bold text-text-secondary">{formatPrice(partnerPaid)}</p></div>
          </div>
        </div>
      </div>

      {/* Сделки */}
      <section>
        <p className="kicker mb-3 text-text-muted">Сделки ({client.sales.length})</p>
        {client.sales.length === 0 ? (
          <div className="rounded-card border border-dashed border-border p-8 text-center text-text-muted">
            Сделок пока нет. Добавьте первую ниже.
          </div>
        ) : (
          <div className="space-y-3">
            {client.sales.map((s) => {
              const mult = s.expMultiple ?? 1;
              const entry = s.entryFee ?? 0;
              const exitValue = s.amount * mult;
              const clientNet = s.amount * Math.max(0, mult - 1) - (s.sf ?? 0) - entry;
              const partnerTake = s.commission + entry;
              const rent =
                s.yearsToExit && s.yearsToExit > 0 && s.amount > 0
                  ? (partnerTake / s.amount / s.yearsToExit) * 100
                  : null;
              return (
                <div key={s.id} className="rounded-card border border-border bg-surface p-5">
                  {/* Шапка */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {s.companyName}
                        {s.round ? <span className="ml-2 text-sm font-medium text-text-muted">{s.round}</span> : null}
                      </h3>
                      <p className="mt-0.5 text-sm text-text-muted">
                        Вход {formatPrice(s.amount, s.currency)}
                        {s.pricePerUnit != null ? ` · ${formatPrice(s.pricePerUnit, s.currency)}/акц` : ""}
                        {" · "}
                        <span className="nums">{formatDate(s.soldAt)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <form action={toggleCommissionPaid}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          className={`kicker rounded-full border px-2.5 py-1 transition-colors ${
                            s.commissionPaid
                              ? "border-positive/40 bg-positive/10 text-positive"
                              : "border-warning/40 bg-warning/10 text-warning"
                          }`}
                        >
                          {s.commissionPaid ? "Выплачено" : "К выплате"}
                        </button>
                      </form>
                      <Link
                        href={`/agent/clients/${client.id}/sale/${s.id}`}
                        className="text-text-muted transition-colors hover:text-brand"
                        title="Редактировать"
                      >
                        ✎
                      </Link>
                      <form action={deleteSale}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-text-muted transition-colors hover:text-negative" title="Удалить">✕</button>
                      </form>
                    </div>
                  </div>

                  {/* Ключевые цифры */}
                  <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-4">
                    <Metric label="Прогноз выхода" value={`${mult.toFixed(2).replace(".", ",")}× · ${formatPrice(exitValue, s.currency)}`} />
                    <Metric label="Заработок клиента" value={formatPrice(clientNet, s.currency)} cls="text-positive" />
                    <Metric label="Заработок партнёра" value={formatPrice(partnerTake, s.currency)} cls="text-brand" />
                    <Metric label="Рентаб. агента" value={rent != null ? `${rent.toFixed(1).replace(".", ",")}%/год` : "—"} cls="text-positive" />
                  </div>

                  {/* Сборы и горизонт */}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
                    <span>Вход 5%: <b className="nums text-warning">{formatPrice(entry, s.currency)}</b></span>
                    <span>SF агента: <b className="nums text-accent">{formatPrice(s.commission, s.currency)}</b></span>
                    {s.yearsToExit ? (
                      <span>До выхода: <b className="nums text-text-secondary">~{String(s.yearsToExit).replace(".", ",")} лет</b></span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Добавить сделку — каскад компания → раунд, живой расчёт */}
        <div className="mt-4">
          <SaleForm clientId={client.id} companies={companyOptions} />
        </div>
      </section>

      {/* Документы / видео */}
      <section>
        <p className="kicker mb-3 text-text-muted">Документы и видео ({client.documents.length})</p>
        <div className="space-y-2">
          {client.documents.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-surface px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="kicker shrink-0 rounded-control border border-border px-2 py-0.5 text-text-muted">
                  {d.kind === "video" ? "ВИДЕО" : d.kind === "contract" ? "ДОГОВОР" : "ДОК"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{d.title}</p>
                  <p className="nums text-xs text-text-muted">{d.fileName} · {formatSize(d.sizeBytes)} · {formatDate(d.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a href={`/agent/doc/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:underline">
                  Открыть ↗
                </a>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="text-text-muted transition-colors hover:text-negative" title="Удалить">✕</button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {/* Загрузить документ/видео */}
        <form action={uploadDocument} className="mt-4 rounded-card border border-border bg-surface p-5">
          <input type="hidden" name="clientId" value={client.id} />
          <p className="kicker mb-3 text-text-muted">Загрузить файл</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="title" placeholder="Название" className={input} />
            <select name="kind" className={input} defaultValue="doc">
              <option value="doc">Документ</option>
              <option value="contract">Договор</option>
              <option value="video">Видео</option>
            </select>
            <input type="file" name="file" required className="text-sm text-text-secondary file:mr-3 file:rounded-control file:border-0 file:bg-brand file:px-4 file:py-2 file:font-semibold file:text-bg" />
          </div>
          <button className="mt-3 rounded-control bg-brand px-5 py-2 text-sm font-semibold text-bg transition-all hover:brightness-110">
            Загрузить
          </button>
          <p className="mt-2 text-xs text-text-muted">Файлы хранятся в закрытой папке и доступны только вам (до 200 МБ).</p>
        </form>
      </section>
    </div>
  );
}

function Metric({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="bg-surface p-3">
      <p className="kicker text-text-muted">{label}</p>
      <p className={`nums mt-1 font-bold ${cls ?? "text-text-primary"}`}>{value}</p>
    </div>
  );
}
