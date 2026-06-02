import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { isHapticsEnabled } from "../preferences/hapticsPreference";

export type HapticKind =
  | "selection"
  | "light"
  | "medium"
  | "success"
  | "warning"
  | "error";

/**
 * Fire haptic feedback when the user has it enabled (Settings).
 * Default ON on iOS, OFF on Android until the user changes it.
 */
export function triggerHaptic(kind: HapticKind = "light"): void {
  if (Platform.OS === "web" || !isHapticsEnabled()) return;
  try {
    switch (kind) {
      case "selection":
        Haptics.selectionAsync();
        break;
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // unsupported on some devices
  }
}

/** @deprecated Use triggerHaptic */
export const haptic = triggerHaptic;
