import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Frosted tab bar background (design guidelines: glass on tab bar).
 * iOS uses blur; Android uses a translucent solid fallback.
 */
export function GlassTabBarBackground() {
  const { colors, isDark } = useTheme();

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      />
    );
  }

  if (Platform.OS === "android") {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surfaceSecondary + "F2" },
        ]}
      />
    );
  }

  return (
    <BlurView
      intensity={isDark ? 48 : 72}
      tint={isDark ? "dark" : "light"}
      style={StyleSheet.absoluteFill}
    />
  );
}
