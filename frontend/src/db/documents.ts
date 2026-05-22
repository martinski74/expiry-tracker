import { getDb } from "./database";

export type DocumentRow = {
  id: number;
  title: string;
  category_id: number | null;
  expiry_date: string; // ISO yyyy-mm-dd
  issue_date: string | null;
  notes: string | null;
  image_uri: string | null;
  notify_days_before: string; // JSON e.g. "[30,7,1]"
  created_at: string;
  updated_at: string;
  // joined fields (optional)
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
};

export type NewDocumentInput = {
  title: string;
  category_id: number | null;
  expiry_date: string;
  issue_date?: string | null;
  notes?: string | null;
  image_uri?: string | null;
  notify_days_before?: number[];
};

const SELECT_WITH_CATEGORY = `
  SELECT
    d.id, d.title, d.category_id, d.expiry_date, d.issue_date,
    d.notes, d.image_uri, d.notify_days_before, d.created_at, d.updated_at,
    c.name as category_name, c.icon as category_icon, c.color as category_color
  FROM documents d
  LEFT JOIN categories c ON c.id = d.category_id
`;

/** All documents sorted by expiry_date ascending (most urgent first). */
export async function getAllDocuments(): Promise<DocumentRow[]> {
  const db = await getDb();
  const rows = (await db.getAllAsync(
    `${SELECT_WITH_CATEGORY} ORDER BY d.expiry_date ASC;`
  )) as DocumentRow[];
  return rows;
}

export async function getDocumentById(id: number): Promise<DocumentRow | null> {
  const db = await getDb();
  const row = (await db.getFirstAsync(
    `${SELECT_WITH_CATEGORY} WHERE d.id = ?;`,
    [id]
  )) as DocumentRow | null;
  return row ?? null;
}

export async function getDocumentsByCategory(
  categoryId: number
): Promise<DocumentRow[]> {
  const db = await getDb();
  const rows = (await db.getAllAsync(
    `${SELECT_WITH_CATEGORY} WHERE d.category_id = ? ORDER BY d.expiry_date ASC;`,
    [categoryId]
  )) as DocumentRow[];
  return rows;
}

export async function addDocument(input: NewDocumentInput): Promise<number> {
  const db = await getDb();
  const now = new Date().toISOString();
  const notify = JSON.stringify(input.notify_days_before ?? [30, 7, 1]);
  const res = await db.runAsync(
    `INSERT INTO documents
       (title, category_id, expiry_date, issue_date, notes, image_uri, notify_days_before, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      input.title.trim(),
      input.category_id,
      input.expiry_date,
      input.issue_date ?? null,
      input.notes ?? null,
      input.image_uri ?? null,
      notify,
      now,
      now,
    ]
  );
  return res.lastInsertRowId as number;
}

export async function updateDocument(
  id: number,
  input: Partial<NewDocumentInput>
): Promise<void> {
  const db = await getDb();
  const current = await getDocumentById(id);
  if (!current) return;

  const next = {
    title: input.title?.trim() ?? current.title,
    category_id:
      input.category_id !== undefined ? input.category_id : current.category_id,
    expiry_date: input.expiry_date ?? current.expiry_date,
    issue_date:
      input.issue_date !== undefined ? input.issue_date : current.issue_date,
    notes: input.notes !== undefined ? input.notes : current.notes,
    image_uri:
      input.image_uri !== undefined ? input.image_uri : current.image_uri,
    notify_days_before: input.notify_days_before
      ? JSON.stringify(input.notify_days_before)
      : current.notify_days_before,
    updated_at: new Date().toISOString(),
  };

  await db.runAsync(
    `UPDATE documents
       SET title = ?, category_id = ?, expiry_date = ?, issue_date = ?,
           notes = ?, image_uri = ?, notify_days_before = ?, updated_at = ?
     WHERE id = ?;`,
    [
      next.title,
      next.category_id,
      next.expiry_date,
      next.issue_date,
      next.notes,
      next.image_uri,
      next.notify_days_before,
      next.updated_at,
      id,
    ]
  );
}

export async function deleteDocument(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM documents WHERE id = ?;`, [id]);
}

/** Helper — parse the JSON `notify_days_before` field. */
export function parseNotifyDays(raw: string): number[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter((n) => typeof n === "number");
  } catch {
    // ignore
  }
  return [];
}
