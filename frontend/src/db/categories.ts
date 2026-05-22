import { getDb } from "./database";

export type Category = {
  id: number;
  name: string; // i18n key for predefined, literal name for custom
  icon: string;
  color: string;
  is_predefined: 0 | 1;
  created_at: string;
  document_count?: number; // populated by joins when needed
};

/** All categories sorted: predefined first, then custom by created_at. */
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = (await db.getAllAsync(
    `SELECT
       c.id, c.name, c.icon, c.color, c.is_predefined, c.created_at,
       COALESCE(d.cnt, 0) as document_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*) as cnt
       FROM documents
       GROUP BY category_id
     ) d ON d.category_id = c.id
     ORDER BY c.is_predefined DESC, c.created_at ASC;`
  )) as Category[];
  return rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDb();
  const row = (await db.getFirstAsync(
    `SELECT id, name, icon, color, is_predefined, created_at
     FROM categories WHERE id = ?;`,
    [id]
  )) as Category | null;
  return row ?? null;
}

export async function addCustomCategory(input: {
  name: string;
  icon: string;
  color: string;
}): Promise<number> {
  const db = await getDb();
  const now = new Date().toISOString();
  const res = await db.runAsync(
    `INSERT INTO categories (name, icon, color, is_predefined, created_at)
     VALUES (?, ?, ?, 0, ?);`,
    [input.name.trim(), input.icon, input.color, now]
  );
  return res.lastInsertRowId as number;
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  // Only allow deleting custom categories
  await db.runAsync(
    `DELETE FROM categories WHERE id = ? AND is_predefined = 0;`,
    [id]
  );
}
