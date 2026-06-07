import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

// Manrope — современный геометричный гротеск, премиальный вид, полная кириллица
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Pre-IPO Витрина — инвестиции в частные компании до IPO",
  description:
    "Актуальные pre-IPO проекты: цены, объёмы, минимальный чек. Оставьте заявку — свяжемся с вами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
