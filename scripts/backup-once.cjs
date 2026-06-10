// Разовая безопасная копия dev.db (для Планировщика задач Windows).
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "backups");
const SRC = path.join(ROOT, "dev.db");
const KEEP = 60;

fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(DIR, `dev-${ts}.db`);
  const db = new Database(SRC);
  try {
    await db.backup(dest);
  } finally {
    db.close();
  }
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.startsWith("dev-") && f.endsWith(".db"))
    .sort();
  while (files.length > KEEP) fs.unlinkSync(path.join(DIR, files.shift()));
  console.log("backup ok:", path.basename(dest));
  process.exit(0);
})().catch((e) => {
  console.error("backup error:", e.message);
  process.exit(1);
});
