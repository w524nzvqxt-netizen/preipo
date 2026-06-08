// Самосев базы на старте прода.
// Если целевая БД (DATABASE_URL) отсутствует или пуста (нет котировок),
// копируем в неё закоммиченную dev.db со всем контентом. Идемпотентно.
const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL || "file:./dev.db";
const target = path.resolve(url.replace(/^file:/, ""));
const seed = path.resolve("./dev.db");

function quoteCount(file) {
  try {
    if (!fs.existsSync(file)) return -1;
    const Database = require("better-sqlite3");
    const db = new Database(file, { readonly: true });
    const n = db.prepare("SELECT COUNT(*) c FROM Quote").get().c;
    db.close();
    return n;
  } catch {
    return 0; // файл есть, но таблиц/данных нет — считаем пустым
  }
}

try {
  if (target === seed) {
    console.log("[init-db] DATABASE_URL указывает на закоммиченную dev.db — контент на месте.");
  } else {
    const c = quoteCount(target);
    if (c <= 0) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(seed, target);
      console.log(`[init-db] Целевая БД пуста (${c}) — скопировал dev.db → ${target}`);
    } else {
      console.log(`[init-db] Целевая БД уже содержит данные (котировок: ${c}) — пропускаю.`);
    }
  }
} catch (e) {
  console.error("[init-db] Ошибка инициализации БД:", e.message);
  // не валим старт — приложение поднимется, даже если сев не удался
}
