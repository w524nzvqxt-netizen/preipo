// Собирает валидный EPUB 3 из собранной HTML-книги.
// Использование: node build-epub.cjs <input.html> <output.epub> "<Title>" "<Author>" <lang>
const fs = require("fs");
const JSZip = require("jszip");

const [, , IN, OUT, TITLE = "Книга", AUTHOR = "Pre-IPO", LANG = "ru"] = process.argv;
if (!IN || !OUT) { console.error("нужно: <input.html> <output.epub> <title> <author> <lang>"); process.exit(1); }

let html = fs.readFileSync(IN, "utf8");

// ---- 1. извлечь CSS и body ----
const css0 = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
const colophon = (html.match(/<footer class="colophon">([\s\S]*?)<\/footer>/) || [, ""])[1];
let body = (mainMatch ? mainMatch[1] : html);

// ---- 2. карта переменных из первого :root{...} ----
const rootBlock = (css0.match(/:root\s*\{([\s\S]*?)\}/) || [, ""])[1];
const vars = {};
rootBlock.replace(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi, (_, k, v) => { vars[k] = v.trim().replace(/"/g, "'"); return ""; });
function flattenVars(s) {
  let prev;
  do { prev = s; s = s.replace(/var\(\s*--([a-z0-9-]+)\s*(?:,\s*([^)]*))?\)/gi, (m, k, fb) => (vars[k] != null ? vars[k] : (fb != null ? fb : "inherit"))); } while (s !== prev);
  return s;
}

// ---- 3. подготовить CSS: убрать dark/[data-theme], google-fonts, экранное меню; уплощить var ----
let css = css0
  .replace(/@media\s*\(prefers-color-scheme:dark\)\s*\{[\s\S]*?\n\}/g, "")
  .replace(/:root\[data-theme="dark"\]\{[\s\S]*?\}/g, "")
  .replace(/@import[^;]+;/g, "");
css = flattenVars(css);
css += `
/* ---- EPUB overrides ---- */
.book{margin-left:0}
.toc,.nav-toggle,.progress,.totop,.scrim,.skip{display:none!important}
.toc-page{display:block!important}
@media screen and (min-width:901px){.toc-page{display:block!important}}
body{font-size:1em}
figure svg{max-width:100%;height:auto}
.cover,.part-divider,.colophon{-webkit-print-color-adjust:exact}
`;

// ---- 4. санитайзинг фрагмента в XHTML ----
const ENT = { nbsp: " ", mdash: "—", ndash: "–", laquo: "«", raquo: "»", hellip: "…", larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔", times: "×", divide: "÷", deg: "°", copy: "©", reg: "®", trade: "™", euro: "€", middot: "·", bull: "•", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", minus: "−", frac12: "½", sup2: "²", sup3: "³", ge: "≥", le: "≤", ne: "≠", approx: "≈", infin: "∞", rarrb: "→", shy: "" };
function sanitize(s) {
  s = flattenVars(s);
  // именованные сущности → литералы; сохранить amp/lt/gt/quot/apos/#num
  s = s.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => {
    if (["amp", "lt", "gt", "quot", "apos"].includes(name)) return m;
    if (ENT[name] != null) return ENT[name];
    return m.replace("&", "&amp;");
  });
  // одиночные & не из сущности → &amp;
  s = s.replace(/&(?!(#[0-9]+|#x[0-9a-fA-F]+|amp|lt|gt|quot|apos);)/g, "&amp;");
  // «голый» < (не начало тега/комментария) → &lt;  (математика, стрелки в тексте)
  s = s.replace(/<(?![a-zA-Z\/!?])/g, "&lt;");
  // void-элементы самозакрыть
  s = s.replace(/<(hr|br|img|meta|link|col|input|source|wbr)\b([^>]*?)\s*\/?>/gi, (m, tag, attrs) => `<${tag}${attrs.replace(/\/\s*$/, "")}/>`);
  // svg: добавить xmlns
  s = s.replace(/<svg\b(?![^>]*xmlns)/gi, '<svg xmlns="http://www.w3.org/2000/svg"');
  // булевы атрибуты hidden/aria-hidden без значения → =""
  s = s.replace(/\s(hidden|controls|playsInline|autoplay|loop|muted)(?=[\s>])/gi, ' $1="$1"');
  return s;
}

// ---- 5. разбить body на верхнеуровневые <section>/<footer> ----
body += colophon ? `\n<footer class="colophon"><div class="wrap">${colophon}</div></footer>` : "";
const blocks = [];
const re = /<(section|footer)\b[^>]*>[\s\S]*?<\/\1>/g;
let m;
while ((m = re.exec(body))) blocks.push(m[0]);

// сгруппировать: front (до 1-го part-divider) | по частям | приложения по-отдельности
const docs = [];
let cur = null;
function pushCur() { if (cur && cur.html) docs.push(cur); cur = null; }
for (const b of blocks) {
  const isPart = /class="part-divider"/.test(b);
  const isCover = /class="cover"/.test(b) || /class="frontmatter"/.test(b) || /class="toc-page"/.test(b);
  const isAppendix = /class="appendix/.test(b) || /class="colophon"/.test(b);
  const id = (b.match(/id="([^"]+)"/) || [, ""])[1];
  const title = (b.match(/class="ch-title"[^>]*>([\s\S]*?)<\/h2>/) || b.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || b.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1].replace(/<[^>]+>/g, "").trim();
  if (isPart) { pushCur(); cur = { id, title: title || "Часть", html: b, nav: [] }; }
  else if (isAppendix) { pushCur(); docs.push({ id, title: title || "Приложение", html: b, nav: [] }); }
  else if (isCover) { if (!cur || cur.front !== true) { pushCur(); cur = { id: id || "front", title: title || "Начало", html: "", nav: [], front: true }; } cur.html += b; }
  else { // chapter
    if (!cur) cur = { id: id || "c", title: "Главы", html: "", nav: [] };
    cur.html += b;
    if (id && title) cur.nav.push({ id, title });
  }
}
pushCur();

// ---- 6. собрать EPUB ----
const zip = new JSZip();
zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);
zip.file("OEBPS/style.css", css);

const xhtml = (title, inner) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${LANG}" lang="${LANG}">
<head><meta charset="utf-8"/><title>${title.replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;")}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="book">${inner}</body></html>`;

const manifest = [];
const spine = [];
const navItems = [];
docs.forEach((d, i) => {
  const fname = `p${String(i).padStart(2, "0")}.xhtml`;
  zip.file("OEBPS/" + fname, xhtml(d.title || "Раздел", sanitize(d.html)));
  manifest.push(`<item id="d${i}" href="${fname}" media-type="application/xhtml+xml"/>`);
  spine.push(`<itemref idref="d${i}"/>`);
  const subs = (d.nav || []).map(s => `<li><a href="${fname}#${s.id}">${s.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a></li>`).join("");
  navItems.push(`<li><a href="${fname}${d.id ? "#" + d.id : ""}">${(d.title || "Раздел").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>${subs ? `<ol>${subs}</ol>` : ""}</li>`);
});

const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${LANG}" lang="${LANG}">
<head><meta charset="utf-8"/><title>Содержание</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><nav epub:type="toc" id="toc"><h1>Содержание</h1><ol>${navItems.join("")}</ol></nav></body></html>`;
zip.file("OEBPS/nav.xhtml", navXhtml);

const uuid = "urn:uuid:" + [8, 4, 4, 4, 12].map(n => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")).join("-");
const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${uuid}</dc:identifier>
    <dc:title>${TITLE.replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;")}</dc:title>
    <dc:creator>${AUTHOR.replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;")}</dc:creator>
    <dc:language>${LANG}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifest.join("\n    ")}
  </manifest>
  <spine>
    ${spine.join("\n    ")}
  </spine>
</package>`;
zip.file("OEBPS/content.opf", opf);

zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip", compression: "DEFLATE" }).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log(`✅ EPUB: ${OUT} — ${(buf.length / 1048576).toFixed(1)} МБ, документов: ${docs.length}, глав в навигации: ${navItems.length}`);
});
