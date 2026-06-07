// Кнопки прямой связи: Telegram / WhatsApp / Email
import { contacts } from "@/lib/config";

export function ContactButtons({ size = "md" }: { size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5";
  const items = [
    contacts.telegram && {
      href: contacts.telegram,
      label: "Telegram",
      cls: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",
    },
    contacts.whatsapp && {
      href: contacts.whatsapp,
      label: "WhatsApp",
      cls: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    },
    contacts.email && {
      href: `mailto:${contacts.email}`,
      label: "Email",
      cls: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200",
    },
  ].filter(Boolean) as { href: string; label: string; cls: string }[];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg border font-medium transition-colors ${pad} ${it.cls}`}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}
