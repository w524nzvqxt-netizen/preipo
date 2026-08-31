// Контакты оператора для кнопок "связаться".
// Номер WhatsApp гарантирован дефолтом: env используется, только если задан
// реальный (не старая заглушка 79990000000).
const WA = process.env.NEXT_PUBLIC_WHATSAPP;
const WHATSAPP_DEFAULT = "https://wa.me/79858884442";
export const contacts = {
  telegram: process.env.NEXT_PUBLIC_TELEGRAM || "https://t.me/twix43",
  whatsapp: WA && !WA.includes("79990000000") ? WA : WHATSAPP_DEFAULT,
  email: process.env.NEXT_PUBLIC_EMAIL || "",
};
