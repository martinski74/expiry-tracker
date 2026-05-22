// Web DateField — renders a styled native <input type="date">
// so the browser's built-in date picker pops up reliably on click.
import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";
import { spacing, fontSize, radius } from "../theme/colors";
import type { DateFieldProps } from "./DateField";

function toInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateField({
  value,
  onChange,
  placeholder,
  error,
  clearLabel,
  testID,
}: DateFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <input
        data-testid={testID}
        type="date"
        value={value ? toInputValue(value) : ""}
        onChange={(e: any) => {
          const v = e.target.value;
          if (!v) {
            onChange(null);
            return;
          }
          const [yy, mm, dd] = v.split("-").map(Number);
          onChange(new Date(yy, (mm || 1) - 1, dd || 1));
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: error ? colors.error : colors.border,
          backgroundColor: colors.surfaceSecondary,
          color: colors.onSurface,
          fontSize: 16,
          fontWeight: 500,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          paddingRight: 12,
          fontFamily: "inherit",
          outline: "none",
        }}
      />
      {value ? (
        <Pressable
          testID={`${testID}-clear`}
          onPress={() => onChange(null)}
          style={[styles.clearBtn, { backgroundColor: colors.surfaceTertiary }]}
        >
          <Text
            style={{
              color: colors.onSurfaceSecondary,
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            {clearLabel}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.iconHint, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.onSurfaceTertiary}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconHint: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
