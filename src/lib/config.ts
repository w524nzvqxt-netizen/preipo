// Контакты оператора для кнопок "связаться" (берутся из .env)
export const contacts = {
  telegram: process.env.NEXT_PUBLIC_TELEGRAM || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  email: process.env.NEXT_PUBLIC_EMAIL || "",
};
