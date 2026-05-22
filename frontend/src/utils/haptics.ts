// Tiny haptics wrapper — safe to call on web (no-op).
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function haptic(kind: "light" | "medium" | "success" | "warning" = "light") {
  if (Platform.OS === "web") return;
  try {
    switch (kind) {
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
    }
  } catch {
    // ignore — older devices may not support haptics
  }
}
