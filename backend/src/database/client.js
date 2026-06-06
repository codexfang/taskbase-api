const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'taskbase.db');

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function query(sql, params = []) {
  const d = await getDb();
  const stmt = d.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function run(sql, params = []) {
  const d = await getDb();
  if (params.length > 0) {
    d.run(sql, params);
  } else {
    d.run(sql);
  }
  save();
  return { changes: d.getRowsModified() };
}

async function migrate() {
  const d = await getDb();

  d.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  let hasPriority = false;
  try {
    const r = d.exec(
      "SELECT COUNT(*) AS c FROM pragma_table_info('tasks') WHERE name = 'priority'"
    );
    if (r.length > 0 && r[0].values.length > 0) {
      hasPriority = r[0].values[0][0] > 0;
    }
  } catch {
    try {
      const stmt = d.prepare(
        "SELECT COUNT(*) AS c FROM pragma_table_info('tasks') WHERE name = 'priority'"
      );
      stmt.bind([]);
      if (stmt.step()) {
        hasPriority = stmt.getAsObject().c > 0;
      }
      stmt.free();
    } catch {
      // pragma_table_info not available
    }
  }

  if (!hasPriority) {
    d.run(
      "ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high'))"
    );
  }

  save();
}

module.exports = { query, get, run, migrate };
