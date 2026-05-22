import * as SQLite from "expo-sqlite";

const DB_NAME = "expiry_tracker.db";

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Open (or reuse) the local SQLite database.
 * Safe to call multiple times — returns the same instance.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  return _db;
}

/**
 * Create tables if they don't exist and seed predefined categories
 * on first launch. Idempotent — safe to call on every app start.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDb();

  // Use WAL for better concurrency / performance
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  // categories table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // documents table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER,
      expiry_date TEXT NOT NULL,
      issue_date TEXT,
      notes TEXT,
      image_uri TEXT,
      notify_days_before TEXT NOT NULL DEFAULT '[30,7,1]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);`
  );
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);`
  );

  await seedPredefinedCategories();
}

/**
 * Insert the 4 predefined categories on first run.
 * Uses i18n keys (e.g. "documents") for the `name` field — the UI
 * translates predefined names via the dictionary.
 */
async function seedPredefinedCategories(): Promise<void> {
  const db = await getDb();
  const row = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM categories WHERE is_predefined = 1;`
  )) as { count: number } | null;

  if (row && row.count > 0) return; // already seeded

  const now = new Date().toISOString();
  const predefined: Array<{ name: string; icon: string; color: string }> = [
    { name: "documents", icon: "document-text-outline", color: "#E07A5F" },
    { name: "insurance", icon: "shield-checkmark-outline", color: "#829C7F" },
    { name: "warranties", icon: "construct-outline", color: "#E4B363" },
    { name: "other", icon: "ellipsis-horizontal-outline", color: "#7CA1A6" },
  ];

  for (const cat of predefined) {
    await db.runAsync(
      `INSERT INTO categories (name, icon, color, is_predefined, created_at) VALUES (?, ?, ?, 1, ?);`,
      [cat.name, cat.icon, cat.color, now]
    );
  }
}

/**
 * DANGEROUS — only used for dev tooling. Wipes all tables.
 */
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DROP TABLE IF EXISTS documents;`);
  await db.execAsync(`DROP TABLE IF EXISTS categories;`);
  await initDatabase();
}
