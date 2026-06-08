// Генерация PDF-разборов аналитика + запись в БД.
// Для каждой компании: сохраняет анализ в Project.financialAnalysis,
// рендерит PDF (с графиками) в public/uploads/analysis/, цепляет ProjectDocument.
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const db = require("better-sqlite3")(path.resolve(__dirname, "..", "dev.db"));

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "uploads", "analysis");
fs.mkdirSync(OUT_DIR, { recursive: true });

const analyses = JSON.parse(fs.readFileSync(path.join(__dirname, "analyses.json"), "utf8"));
const SLUG = { "Cashea": "cashea", "Cursor": "cursor", "OpenEvidence": "openevidence", "Tamara": "tamara", "Project Prometheus": "prometheus" };

// палитра (RGB) под токены сайта
const C = {
  ink: "#1A1916", sec: "#5C5852", mut: "#7A756C", line: "#E6E2DA",
  brand: "#15715E", brandBg: "#E8F1ED", pos: "#1E7A55", neg: "#B23B36", warn: "#9A6B1E", acc: "#1F6F8B",
};
function money(v) {
  if (v == null) return "—";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(1).replace(".", ",") + " млрд";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(0) + " млн";
  if (v >= 1e3) return "$" + Math.round(v / 1e3) + " тыс";
  return "$" + v;
}
function cuid(p) { return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function genPdf(project, a, file) {
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Аналитический разбор — ${project.name}` } });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);
  // Шрифты с кириллицей (встраиваются в PDF). Arial есть на Windows.
  const FONTS = "C:/Windows/Fonts";
  doc.registerFont("body", `${FONTS}/arial.ttf`);
  doc.registerFont("bold", `${FONTS}/arialbd.ttf`);
  doc.registerFont("italic", `${FONTS}/ariali.ttf`);
  const W = doc.page.width, M = 48, CW = W - M * 2;

  // ── шапка
  doc.rect(0, 0, W, 96).fill(C.ink);
  doc.fillColor("#FFFFFF").fontSize(22).font("bold").text(project.name, M, 30);
  doc.fillColor("#C9C5BD").fontSize(10).font("body").text((project.sector || "") + "  ·  Аналитический разбор fin-модели и бизнеса", M, 60);
  // бейдж рейтинга
  const badge = `${a.rating}  ·  ${a.ratingScore}/10`;
  doc.fontSize(9).font("bold");
  const bw = doc.widthOfString(badge) + 20;
  doc.roundedRect(W - M - bw, 34, bw, 22, 11).fill(C.brand);
  doc.fillColor("#FFFFFF").text(badge, W - M - bw + 10, 40);
  doc.x = M; doc.y = 116;

  const H = (t) => { doc.moveDown(0.6); doc.x = M; doc.fillColor(C.brand).fontSize(8).font("bold").text(t.toUpperCase(), { characterSpacing: 0.6 }); doc.moveDown(0.2); doc.fillColor(C.ink).fontSize(10).font("body"); };
  const P = (t, color) => { doc.x = M; doc.fillColor(color || C.sec).fontSize(9.5).font("body").text(t, { align: "left", lineGap: 1.5 }); };
  const BUL = (arr, color) => { arr.forEach((x) => { const y = doc.y + 5; doc.circle(M + 3, y, 1.6).fill(color || C.brand); doc.fillColor(C.sec).fontSize(9.5).font("body").text(x, M + 12, doc.y, { width: CW - 12, lineGap: 1.5 }); doc.moveDown(0.15); }); };

  // тезис
  doc.fillColor(C.ink).fontSize(11.5).font("bold").text(a.thesis, { lineGap: 2 });
  H("Резюме"); P(a.execSummary);

  // метрики (2 колонки)
  H("Ключевые показатели");
  const col = CW / 2, rowH = 18; let i = 0;
  const startY = doc.y;
  a.metrics.forEach((m, idx) => {
    const cx = M + (idx % 2) * col, cy = startY + Math.floor(idx / 2) * rowH;
    doc.fillColor(C.mut).fontSize(8).font("body").text(m[0], cx, cy, { width: col - 70 });
    doc.fillColor(C.ink).fontSize(9.5).font("bold").text(m[1], cx + col - 76, cy, { width: 70, align: "right" });
    i = idx;
  });
  doc.y = startY + (Math.floor(i / 2) + 1) * rowH + 4;

  // график сценариев на $100k
  let scen = [];
  try { scen = JSON.parse(project.scenarios || "[]"); } catch {}
  if (scen.length) {
    H("Сценарии на $100 000 (нетто)");
    const max = Math.max(...scen.map((s) => s.val || 0)) || 1;
    const barW = CW - 130, x0 = M + 70;
    scen.forEach((s) => {
      const y = doc.y + 4, w = Math.max(4, (barW * (s.val || 0)) / max);
      const col2 = s.color === "emerald" ? C.pos : s.color === "amber" ? C.warn : C.acc;
      doc.fillColor(C.sec).fontSize(8.5).font("body").text(s.key, M, y + 1, { width: 64 });
      doc.roundedRect(x0, y, w, 12, 2).fill(col2);
      doc.fillColor(C.ink).fontSize(8.5).font("bold").text("$" + Math.round((s.val || 0) / 1000) + "k · ×" + (s.mult || 0).toFixed(1).replace(".", ","), x0 + w + 6, y + 1);
      doc.y = y + 18;
    });
  }

  // вход → выход
  if (project.valuation && project.exitValuation) {
    H("Цена входа → ожидаемая капитализация на IPO");
    const max = project.exitValuation, x0 = M + 70, barW = CW - 160;
    [["Вход", project.valuation, C.mut], ["Выход", project.exitValuation, C.brand]].forEach(([lab, v, c]) => {
      const y = doc.y + 4, w = Math.max(4, (barW * v) / max);
      doc.fillColor(C.sec).fontSize(8.5).font("body").text(lab, M, y + 1, { width: 64 });
      doc.roundedRect(x0, y, w, 12, 2).fill(c);
      doc.fillColor(C.ink).fontSize(8.5).font("bold").text(money(v), x0 + w + 6, y + 1);
      doc.y = y + 18;
    });
  }

  if (doc.y > doc.page.height - 220) doc.addPage();
  H("Бизнес-модель"); P(a.businessModel);
  H("Финансы"); P(a.financialsSummary);
  H("Оценка"); P(a.valuationSummary);
  doc.fillColor(C.mut).fontSize(8).font("italic").text(`Мультипликатор входа: ${a.entryMultiple}. ${a.peerNote}`, { lineGap: 1 });
  H("Оценка сценариев"); P(a.scenarioView);
  if (doc.y > doc.page.height - 200) doc.addPage();
  H("Драйверы роста"); BUL(a.keyDrivers, C.pos);
  H("Ключевые риски"); BUL(a.risks, C.neg);
  H("Вердикт аналитика");
  doc.fillColor(C.ink).fontSize(10).font("bold").text(a.verdict, { lineGap: 2 });

  // футер-дисклеймер
  doc.moveDown(1);
  doc.fillColor(C.mut).fontSize(7).font("body").text("Не является индивидуальной инвестиционной рекомендацией и гарантией доходности. Аналитическая оценка на основе материалов сделки и публичных источников (июнь 2026). Инвестиции в pre-IPO высокорисковые, возможна полная потеря средств.", { lineGap: 1 });

  doc.end();
  return new Promise((res) => stream.on("finish", res));
}

(async () => {
  for (const [name, a] of Object.entries(analyses)) {
    const project = db.prepare("SELECT * FROM Project WHERE name=?").get(name);
    if (!project) { console.log("✗ нет проекта:", name); continue; }
    const slug = SLUG[name] || name.toLowerCase().replace(/\s+/g, "-");
    const file = path.join(OUT_DIR, slug + ".pdf");
    await genPdf(project, a, file);
    const size = fs.statSync(file).size;
    const fileUrl = `/uploads/analysis/${slug}.pdf`;

    // сохранить анализ в проект
    db.prepare("UPDATE Project SET financialAnalysis=? WHERE id=?").run(JSON.stringify(a), project.id);

    // прикрепить документ (без дублей)
    const ex = db.prepare("SELECT id FROM ProjectDocument WHERE projectId=? AND kind=?").get(project.id, "analysis");
    const docRow = { title: `Аналитический разбор — ${name}`, kind: "analysis", fileUrl, fileName: slug + ".pdf", sizeBytes: size };
    if (ex) {
      db.prepare("UPDATE ProjectDocument SET title=@title, fileUrl=@fileUrl, fileName=@fileName, sizeBytes=@sizeBytes WHERE id=@id").run({ ...docRow, id: ex.id });
    } else {
      db.prepare("INSERT INTO ProjectDocument (id,projectId,title,kind,fileUrl,fileName,sizeBytes,createdAt) VALUES (@id,@projectId,@title,@kind,@fileUrl,@fileName,@sizeBytes,@createdAt)")
        .run({ id: cuid("doc"), projectId: project.id, ...docRow, createdAt: new Date().toISOString() });
    }
    console.log(`✅ ${name}: PDF ${(size / 1024).toFixed(0)}KB + анализ в БД`);
  }
})();
