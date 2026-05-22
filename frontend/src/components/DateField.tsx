// Native DateField — uses @react-native-community/datetimepicker.
// The web variant is in DateField.web.tsx.
import React, { useState } from "react";
import { View, Pressable, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/ThemeProvider";
import { spacing, fontSize, radius } from "../theme/colors";
import { formatExpiryDate } from "../utils/urgency";

export type DateFieldProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  locale: string;
  error?: boolean;
  clearLabel: string;
  testID: string;
};

export function DateField({
  value,
  onChange,
  placeholder,
  locale,
  error,
  clearLabel,
  testID,
}: DateFieldProps) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={styles.row}>
      <Pressable
        testID={testID}
        onPress={() => setShow(true)}
        style={({ pressed }) => [
          styles.input,
          {
            flex: 1,
            backgroundColor: colors.surfaceSecondary,
            borderColor: error ? colors.error : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={colors.onSurfaceTertiary}
        />
        <Text
          style={{
            color: value ? colors.onSurface : colors.onSurfaceTertiary,
            fontSize: fontSize.base,
            fontWeight: "500",
          }}
        >
          {value ? formatExpiryDate(value.toISOString(), locale) : placeholder}
        </Text>
      </Pressable>
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
      ) : null}
      {show ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          onChange={(_, d) => {
            if (Platform.OS !== "ios") setShow(false);
            if (d) {
              onChange(d);
              if (Platform.OS === "ios") setShow(false);
            } else {
              setShow(false);
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
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
});
