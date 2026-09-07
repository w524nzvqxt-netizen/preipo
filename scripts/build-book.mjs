// Единый сборщик книги: исходный index.html -> public/books/<slug>.{html,pdf,epub}
// Шаги: 1) копия HTML в public/books  2) Chrome headless -> PDF  3) нумерация страниц
//       4) EPUB через build-epub.cjs.  Chrome/Edge определяются автоматически.
//
// Запуск:  node scripts/build-book.mjs <slug> "<Title>" "<Author>" [pathToSourceHtml]
//   slug             — do-birzhi | razum-mashin
//   Title/Author     — метаданные EPUB/PDF
//   pathToSourceHtml — опц.; по умолчанию берётся из карты SOURCES
//
// Требует: Chrome или Edge в системе; jszip + pdf-lib в node_modules (есть).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "books");

const SOURCES = {
  "do-birzhi": path.join(ROOT, "preipo-book", "index.html"),
  "razum-mashin": path.join(ROOT, "ai-textbook", "index.html"),
};

function findBrowser() {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    process.env.CHROME_PATH,
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error("Не найден Chrome/Edge. Задай CHROME_PATH.");
}

function fileUrl(p) {
  return "file:///" + path.resolve(p).replace(/\\/g, "/");
}

function main() {
  const [slug, title = "Книга", author = "Pre-IPO", srcArg] = process.argv.slice(2);
  if (!slug) {
    console.error('Использование: node scripts/build-book.mjs <slug> "<Title>" "<Author>" [source.html]');
    process.exit(1);
  }
  const src = srcArg || SOURCES[slug];
  if (!src || !fs.existsSync(src)) {
    console.error("Нет исходного HTML:", src);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const htmlOut = path.join(OUT_DIR, `${slug}.html`);
  const pdfOut = path.join(OUT_DIR, `${slug}.pdf`);
  const epubOut = path.join(OUT_DIR, `${slug}.epub`);

  // 1) HTML
  fs.copyFileSync(src, htmlOut);
  console.log("✔ HTML:", path.relative(ROOT, htmlOut));

  // 2) PDF через headless-браузер (печать из исходника, чтобы web-шрифты подтянулись)
  const browser = findBrowser();
  const tmpPdf = path.join(OUT_DIR, `.${slug}.tmp.pdf`);
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-pdf-header-footer",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=20000",
      `--print-to-pdf=${tmpPdf}`,
      fileUrl(src),
    ],
    { stdio: ["ignore", "ignore", "ignore"], timeout: 180000 }
  );
  if (!fs.existsSync(tmpPdf)) throw new Error("PDF не создан браузером");

  // 3) нумерация страниц (обложка — без номера)
  execFileSync("node", [path.join(ROOT, "ai-textbook", "stamp-pdf.cjs"), tmpPdf, pdfOut], {
    stdio: "inherit",
    cwd: ROOT,
  });
  fs.rmSync(tmpPdf, { force: true });
  console.log("✔ PDF:", path.relative(ROOT, pdfOut), `(${(fs.statSync(pdfOut).size / 1e6).toFixed(1)} МБ)`);

  // 4) EPUB
  execFileSync(
    "node",
    [path.join(ROOT, "ai-textbook", "build-epub.cjs"), htmlOut, epubOut, title, author, "ru"],
    { stdio: "inherit", cwd: ROOT }
  );
  console.log("✔ EPUB:", path.relative(ROOT, epubOut), `(${(fs.statSync(epubOut).size / 1e3).toFixed(0)} КБ)`);

  console.log(`\nГотово: ${slug} → public/books/${slug}.{html,pdf,epub}`);
}

main();
