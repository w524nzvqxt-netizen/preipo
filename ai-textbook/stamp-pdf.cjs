// Проставляет номера страниц внизу по центру. Пропускает 1-ю страницу (обложку).
// Использование: node stamp-pdf.cjs <in.pdf> [out.pdf]   (без out — на месте)
const fs = require("fs");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

(async () => {
  const inPath = process.argv[2];
  const outPath = process.argv[3] || inPath;
  if (!inPath || !fs.existsSync(inPath)) { console.error("нет входного PDF:", inPath); process.exit(1); }

  const bytes = fs.readFileSync(inPath);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;

  pages.forEach((page, i) => {
    if (i === 0) return; // обложка без номера
    const { width } = page.getSize();
    const label = `${i + 1} / ${total}`;
    const size = 8.5;
    const w = font.widthOfTextAtSize(label, size);
    // лёгкая подложка для читаемости на любом фоне
    page.drawRectangle({ x: width / 2 - w / 2 - 6, y: 18, width: w + 12, height: size + 8, color: rgb(0.5, 0.5, 0.53), opacity: 0.14, borderWidth: 0 });
    page.drawText(label, { x: width / 2 - w / 2, y: 22, size, font, color: rgb(0.42, 0.43, 0.48) });
  });

  const out = await pdf.save();
  const tmp = outPath === inPath ? outPath + ".tmp" : outPath;
  fs.writeFileSync(tmp, out);
  if (tmp !== outPath) { fs.rmSync(outPath, { force: true }); fs.renameSync(tmp, outPath); }
  console.log(`✅ пронумеровано ${total - 1} страниц (обложка без номера) → ${outPath}`);
})().catch((e) => { console.error("ОШИБКА:", e.message); process.exit(1); });
