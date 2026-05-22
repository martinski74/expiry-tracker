import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persisted state hook backed by AsyncStorage.
 * The initial value is returned immediately; the stored value
 * (if any) is loaded asynchronously and replaces the initial one.
 */
export function useStoredValue<T>(
  key: string,
  initial: T
): [T, (next: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (mounted && raw != null) {
          setValue(JSON.parse(raw) as T);
        }
      } catch {
        // ignore — fall back to initial
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [key]);

  const set = useCallback(
    async (next: T) => {
      setValue(next);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [key]
  );

  return [value, set, ready];
}

export const STORAGE_KEYS = {
  defaultReminders: "@expiry_tracker/default_reminders",
};
