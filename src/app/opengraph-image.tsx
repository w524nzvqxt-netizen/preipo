// Динамическая OG-картинка (1200×630) для превью в Telegram/WhatsApp/X.
// Рендерится Next.js на лету — статичный файл не нужен. Шрифт Manrope
// (латиница+кириллица) читаем из src/assets, чтобы кириллица не была «тофу».
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "Pre-IPO Витрина — инвестируйте в гигантов до IPO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dir = join(process.cwd(), "src/assets");
const fonts = [
  { name: "Manrope", file: "manrope-lat-700.woff", weight: 700 as const },
  { name: "Manrope", file: "manrope-cyr-700.woff", weight: 700 as const },
  { name: "Manrope", file: "manrope-lat-800.woff", weight: 800 as const },
  { name: "Manrope", file: "manrope-cyr-800.woff", weight: 800 as const },
];

export default async function OpengraphImage() {
  const fontData = fonts.map((f) => ({
    name: f.name,
    weight: f.weight,
    style: "normal" as const,
    data: readFileSync(join(dir, f.file)),
  }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070B0E",
          backgroundImage:
            "radial-gradient(900px 500px at 18% 8%, rgba(39,224,168,0.16), transparent 60%), radial-gradient(700px 500px at 100% 100%, rgba(127,217,255,0.10), transparent 55%)",
          padding: "72px 80px",
          fontFamily: "Manrope",
          color: "#ECF1F4",
        }}
      >
        {/* Лого */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 800 }}>
          <div
            style={{
              width: 18,
              height: 18,
              backgroundColor: "#27E0A8",
              transform: "rotate(45deg)",
              borderRadius: 3,
            }}
          />
          <span>Pre-IPO</span>
        </div>

        {/* Заголовок */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: "0 18px",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            <span>Инвестируйте в гигантов</span>
            <span style={{ color: "#27E0A8" }}>до IPO</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#9DACB6", maxWidth: 900 }}>
            Доступ к долям в зрелых частных компаниях до выхода на биржу
          </div>
        </div>

        {/* Трек-рекорд */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              padding: "16px 28px",
              borderRadius: 16,
              border: "1px solid rgba(39,224,168,0.35)",
              backgroundColor: "rgba(39,224,168,0.08)",
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, color: "#9DACB6" }}>Трек-рекорд</span>
            <span style={{ fontSize: 44, fontWeight: 800, color: "#27E0A8" }}>×12,7</span>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#9DACB6" }}>vs S&amp;P 500 ×2,1</span>
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#6B7A85" }}>21 компания от раунда до IPO</span>
        </div>
      </div>
    ),
    { ...size, fonts: fontData }
  );
}
