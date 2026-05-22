import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { initDatabase } from "./database";

type DbContextValue = {
  ready: boolean;
  error: string | null;
};

const DbContext = createContext<DbContextValue>({ ready: false, error: null });

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDatabase();
        if (mounted) setReady(true);
      } catch (e: any) {
        console.error("[DB] init failed:", e);
        if (mounted) setError(e?.message || String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Render children immediately — screens that depend on the DB
  // show their own loading state via useFocusEffect.
  return (
    <DbContext.Provider value={{ ready, error }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  return useContext(DbContext);
}
