// Кнопки прямой связи: Telegram / WhatsApp / Email
import { contacts } from "@/lib/config";

export function ContactButtons({ size = "md" }: { size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5";

  const primary = contacts.telegram
    ? {
        href: contacts.telegram,
        label: "Telegram",
        cls: "bg-brand text-bg hover:brightness-110 border-brand",
      }
    : null;

  const secondaries = [
    contacts.whatsapp && {
      href: contacts.whatsapp,
      label: "WhatsApp",
      cls: "bg-surface text-text-primary border-border hover:bg-surface-alt hover:border-brand",
    },
    contacts.email && {
      href: `mailto:${contacts.email}`,
      label: "Email",
      cls: "bg-surface text-text-primary border-border hover:bg-surface-alt hover:border-brand",
    },
  ].filter(Boolean) as { href: string; label: string; cls: string }[];

  const items = [
    ...(primary ? [primary] : []),
    ...secondaries,
  ];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-control border font-medium transition-colors ${pad} ${it.cls}`}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}
