import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "../hooks/useStoredValue";

let cached: boolean | null = null;

export function getDefaultHapticsEnabled(): boolean {
  return Platform.OS === "ios";
}

export function isHapticsEnabled(): boolean {
  if (cached !== null) return cached;
  return getDefaultHapticsEnabled();
}

export async function loadHapticsPreference(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.hapticsEnabled);
    if (raw != null) {
      try {
        cached = JSON.parse(raw) as boolean;
      } catch {
        cached = raw === "true";
      }
    } else {
      cached = getDefaultHapticsEnabled();
    }
  } catch {
    cached = getDefaultHapticsEnabled();
  }
  return isHapticsEnabled();
}

export function syncHapticsCache(enabled: boolean): void {
  cached = enabled;
}
