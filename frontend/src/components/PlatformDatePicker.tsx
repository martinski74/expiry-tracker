// Native implementation — uses @react-native-community/datetimepicker.
// Metro picks `.web.tsx` for web (see PlatformDatePicker.web.tsx).
import React from "react";
import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  show: boolean;
  value: Date;
  onChange: (date: Date | null) => void;
};

export function PlatformDatePicker({ show, value, onChange }: Props) {
  if (!show) return null;
  return (
    <DateTimePicker
      value={value}
      mode="date"
      onChange={(_, d) => {
        // On Android the picker auto-dismisses; on iOS it stays inline.
        if (Platform.OS !== "ios") {
          onChange(d ?? null);
        } else if (d) {
          onChange(d);
        }
      }}
    />
  );
}
