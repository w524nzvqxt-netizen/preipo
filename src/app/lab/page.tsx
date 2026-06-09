// /lab — изолированная песочница 3D-витрины (пример, не часть главной).
// Карточки компаний летят по орбите лицом к зрителю; при наведении из карточки
// «лучами солнца» расходятся ключевые факты.
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { Carousel3D, type OrbitItem } from "@/components/Carousel3D";

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  const items: OrbitItem[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: [p.sector, p.stage].filter(Boolean).join(" · ") || "Pre-IPO",
    logoUrl: p.logoUrl ?? null,
    facts: [
      p.valuation != null && { label: "Оценка", value: formatMoney(p.valuation) },
      p.expectedReturn != null && { label: "Доходность", value: `${Math.round(p.expectedReturn)}%/год` },
      p.expectedExit && { label: "Выход", value: p.expectedExit },
      p.pricePerShare != null && { label: "Цена доли", value: formatMoney(p.pricePerShare) },
    ].filter(Boolean) as { label: string; value: string }[],
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg">
      {/* фоновое свечение-ядро */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[160px]" />

      <header className="relative z-10 mx-auto max-w-7xl px-6 pt-16 text-center">
        <p className="kicker kicker-gold">Эксперимент · 3D-витрина</p>
        <h1 className="text-display mx-auto mt-3 max-w-3xl text-[clamp(32px,6vw,72px)] font-extrabold leading-[1.02]">
          Компании на орбите
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-text-secondary">
          Наведите курсор на карточку — ключевые факты раскроются лучами. Орбита
          замирает, пока вы изучаете компанию.
        </p>
      </header>

      <Carousel3D items={items} />
    </main>
  );
}
