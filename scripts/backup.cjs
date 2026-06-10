// Автобэкап базы dev.db каждые 10 минут (защита от потери данных при отключении
// электричества). Использует онлайн-бэкап SQLite (консистентная копия даже при
// активной записи). Хранит последние 30 копий в backups/.
// Запуск: node scripts/backup.cjs
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DIR = path.resolve("backups");
const SRC = path.resolve("dev.db");
const KEEP = 30;
const EVERY_MS = 10 * 60 * 1000;

fs.mkdirSync(DIR, { recursive: true });

async function backupOnce() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(DIR, `dev-${ts}.db`);
  const db = new Database(SRC);
  try {
    await db.backup(dest); // онлайн-бэкап (консистентно)
  } finally {
    db.close();
  }
  // чистим старые, оставляем последние KEEP
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.startsWith("dev-") && f.endsWith(".db"))
    .sort();
  while (files.length > KEEP) {
    fs.unlinkSync(path.join(DIR, files.shift()));
  }
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`[${ts}] бэкап: ${path.basename(dest)} (${kb} КБ), копий: ${files.length}`);
}

(async () => {
  console.log("Автобэкап dev.db каждые 10 мин → backups/ (последние " + KEEP + ")");
  for (;;) {
    try {
      await backupOnce();
    } catch (e) {
      console.error("Ошибка бэкапа:", e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, EVERY_MS));
  }
})();
