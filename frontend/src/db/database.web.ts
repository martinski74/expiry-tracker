// Web shim for the database layer.
// expo-sqlite on web requires WASM assets that aren't bundled in this
// preview environment. For web we use a tiny in-memory store with the
// same public API as the native SQLite-backed `database.ts`.
// On iOS / Android, Metro picks `database.ts` (not this file) automatically.

type Row = Record<string, any>;

type Tables = {
  categories: Row[];
  documents: Row[];
};

const tables: Tables = {
  categories: [],
  documents: [],
};

const nextId: Record<keyof Tables, number> = {
  categories: 1,
  documents: 1,
};

let initialized = false;

// --- Public API (mirrors database.ts) ---

export async function getDb(): Promise<any> {
  return { tables }; // opaque handle, callers don't use it directly on web
}

export async function initDatabase(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (tables.categories.length === 0) {
    const now = new Date().toISOString();
    const predefined = [
      { name: "documents", icon: "document-text-outline", color: "#E07A5F" },
      { name: "insurance", icon: "shield-checkmark-outline", color: "#829C7F" },
      { name: "warranties", icon: "construct-outline", color: "#E4B363" },
      { name: "other", icon: "ellipsis-horizontal-outline", color: "#7CA1A6" },
    ];
    for (const c of predefined) {
      tables.categories.push({
        id: nextId.categories++,
        name: c.name,
        icon: c.icon,
        color: c.color,
        is_predefined: 1,
        created_at: now,
      });
    }
  }
}

export async function resetDatabase(): Promise<void> {
  tables.categories = [];
  tables.documents = [];
  nextId.categories = 1;
  nextId.documents = 1;
  initialized = false;
  await initDatabase();
}

// --- Internal helpers exposed for categories.web.ts / documents.web.ts ---
export const _webStore = {
  tables,
  nextId,
};
