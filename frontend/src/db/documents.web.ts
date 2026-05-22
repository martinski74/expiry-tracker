import { _webStore } from "./database.web";
import type { DocumentRow, NewDocumentInput } from "./documents";

export type { DocumentRow, NewDocumentInput } from "./documents";

function withCategory(d: any): DocumentRow {
  const cat = _webStore.tables.categories.find((c) => c.id === d.category_id);
  return {
    ...d,
    category_name: cat?.name ?? null,
    category_icon: cat?.icon ?? null,
    category_color: cat?.color ?? null,
  } as DocumentRow;
}

export async function getAllDocuments(): Promise<DocumentRow[]> {
  return _webStore.tables.documents
    .slice()
    .sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)))
    .map(withCategory);
}

export async function getDocumentById(id: number): Promise<DocumentRow | null> {
  const d = _webStore.tables.documents.find((x) => x.id === id);
  return d ? withCategory(d) : null;
}

export async function getDocumentsByCategory(
  categoryId: number
): Promise<DocumentRow[]> {
  return _webStore.tables.documents
    .filter((d) => d.category_id === categoryId)
    .sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)))
    .map(withCategory);
}

export async function addDocument(input: NewDocumentInput): Promise<number> {
  const { tables, nextId } = _webStore;
  const id = nextId.documents++;
  const now = new Date().toISOString();
  tables.documents.push({
    id,
    title: input.title.trim(),
    category_id: input.category_id,
    expiry_date: input.expiry_date,
    issue_date: input.issue_date ?? null,
    notes: input.notes ?? null,
    image_uri: input.image_uri ?? null,
    notify_days_before: JSON.stringify(input.notify_days_before ?? [30, 7, 1]),
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateDocument(
  id: number,
  input: Partial<NewDocumentInput>
): Promise<void> {
  const d = _webStore.tables.documents.find((x) => x.id === id);
  if (!d) return;
  if (input.title !== undefined) d.title = input.title.trim();
  if (input.category_id !== undefined) d.category_id = input.category_id;
  if (input.expiry_date !== undefined) d.expiry_date = input.expiry_date;
  if (input.issue_date !== undefined) d.issue_date = input.issue_date;
  if (input.notes !== undefined) d.notes = input.notes;
  if (input.image_uri !== undefined) d.image_uri = input.image_uri;
  if (input.notify_days_before !== undefined)
    d.notify_days_before = JSON.stringify(input.notify_days_before);
  d.updated_at = new Date().toISOString();
}

export async function deleteDocument(id: number): Promise<void> {
  const { tables } = _webStore;
  const idx = tables.documents.findIndex((d) => d.id === id);
  if (idx >= 0) tables.documents.splice(idx, 1);
}

export function parseNotifyDays(raw: string): number[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter((n) => typeof n === "number");
  } catch {
    // ignore
  }
  return [];
}
