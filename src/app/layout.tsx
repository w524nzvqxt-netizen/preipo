import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { CustomCursor } from "@/components/motion/CustomCursor";

// Manrope — современный геометричный гротеск, премиальный вид, полная кириллица
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const SITE_URL = "https://pre-ipo.pro";
const OG_TITLE = "Инвестируйте в гигантов до IPO";
const OG_DESC =
  "Доступ к долям в зрелых частных компаниях до выхода на биржу. Трек-рекорд ×12,7 против S&P 500 ×2,1. Отобранные сделки и аналитика.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Pre-IPO Витрина — инвестиции в частные компании до IPO",
  description:
    "Актуальные pre-IPO проекты: цены, объёмы, минимальный чек. Оставьте заявку — свяжемся с вами.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Pre-IPO Витрина",
    title: OG_TITLE,
    description: OG_DESC,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <ScrollProgress />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
