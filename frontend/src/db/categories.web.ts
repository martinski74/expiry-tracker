import { _webStore } from "./database.web";
import type { Category } from "./categories";

export type { Category } from "./categories";

export async function getAllCategories(): Promise<Category[]> {
  const { tables } = _webStore;
  const counts = new Map<number, number>();
  for (const d of tables.documents) {
    counts.set(d.category_id, (counts.get(d.category_id) || 0) + 1);
  }
  return tables.categories
    .slice()
    .sort((a, b) => {
      if (a.is_predefined !== b.is_predefined) return b.is_predefined - a.is_predefined;
      return String(a.created_at).localeCompare(String(b.created_at));
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      is_predefined: c.is_predefined,
      created_at: c.created_at,
      document_count: counts.get(c.id) || 0,
    }));
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const c = _webStore.tables.categories.find((x) => x.id === id);
  return c ? (c as Category) : null;
}

export async function addCustomCategory(input: {
  name: string;
  icon: string;
  color: string;
}): Promise<number> {
  const { tables, nextId } = _webStore;
  const id = nextId.categories++;
  tables.categories.push({
    id,
    name: input.name.trim(),
    icon: input.icon,
    color: input.color,
    is_predefined: 0,
    created_at: new Date().toISOString(),
  });
  return id;
}

export async function deleteCategory(id: number): Promise<void> {
  const { tables } = _webStore;
  const idx = tables.categories.findIndex(
    (c) => c.id === id && c.is_predefined === 0
  );
  if (idx >= 0) tables.categories.splice(idx, 1);
}
