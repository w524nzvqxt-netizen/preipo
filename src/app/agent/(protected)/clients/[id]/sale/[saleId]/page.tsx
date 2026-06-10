// Редактирование сделки — та же форма с каскадом, предзаполненная значениями.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { getCompanyOptions } from "@/lib/agent-companies";
import { SaleForm } from "@/components/agent/SaleForm";

export const dynamic = "force-dynamic";

export default async function EditSalePage({ params }: { params: Promise<{ id: string; saleId: string }> }) {
  const agent = await requireAgent();
  const { id, saleId } = await params;

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, agentId: agent.id, clientId: id }, // только своя сделка своего клиента
  });
  if (!sale) notFound();

  const companies = await getCompanyOptions();

  return (
    <div className="space-y-6">
      <Link href={`/agent/clients/${id}`} className="text-sm text-text-muted transition-colors hover:text-brand">
        ← К клиенту
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Редактирование сделки</h1>
      <SaleForm
        clientId={id}
        companies={companies}
        initial={{
          id: sale.id,
          companyName: sale.companyName,
          round: sale.round,
          amount: sale.amount,
          pricePerUnit: sale.pricePerUnit,
          yearsToExit: sale.yearsToExit,
          currency: sale.currency,
          commissionPaid: sale.commissionPaid,
          note: sale.note,
        }}
      />
    </div>
  );
}
