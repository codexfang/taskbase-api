const path = require('path');
const fs = require('fs');

const USE_PG = !!process.env.DATABASE_URL;

let sqlite;
let pgPool;

if (USE_PG) {
  const { Pool } = require('pg');
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, '..', '..', 'data');
  const dbPath = path.join(dataDir, 'taskbase.db');
  fs.mkdirSync(dataDir, { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
}

function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function toPgTs(sql) {
  return sql
    .replace(/datetime\('now'\)/g, "NOW()")
    .replace(/datetime\('now'/g, "NOW()");
}

async function query(sql, params = []) {
  if (USE_PG) {
    const result = await pgPool.query(toPgTs(toPg(sql)), params);
    return result.rows;
  }
  return sqlite.prepare(sql).all(...params);
}

async function get(sql, params = []) {
  if (USE_PG) {
    const result = await pgPool.query(toPgTs(toPg(sql)), params);
    return result.rows[0] || null;
  }
  const row = sqlite.prepare(sql).get(...params);
  return row || null;
}

async function run(sql, params = []) {
  if (USE_PG) {
    await pgPool.query(toPgTs(toPg(sql)), params);
    return { changes: 1 };
  }
  sqlite.prepare(sql).run(...params);
  return { changes: sqlite.changes };
}

async function migrate() {
  if (USE_PG) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } else {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const hasPriority = sqlite.prepare(
      "SELECT COUNT(*) AS c FROM pragma_table_info('tasks') WHERE name = 'priority'"
    ).get().c > 0;
    if (!hasPriority) {
      sqlite.exec("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high'))");
    }
  }
}

module.exports = { query, get, run, migrate };
