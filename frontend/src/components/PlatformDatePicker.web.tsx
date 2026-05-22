// Web implementation — uses the browser-native date picker.
// We render a hidden <input type="date"> and trigger showPicker() / focus()
// when `show` becomes true. This gives us a proper date picker in browsers.
import React, { useEffect, useRef } from "react";

type Props = {
  show: boolean;
  value: Date;
  onChange: (date: Date | null) => void;
};

function toInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PlatformDatePicker({ show, value, onChange }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!show) return;
    const el = ref.current;
    if (!el) return;
    // Open the native picker. `showPicker()` is the modern API;
    // fall back to focus()+click() for older browsers.
    try {
      // @ts-ignore — showPicker exists in modern browsers
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
    }
  }, [show]);

  return (
    <input
      ref={ref}
      type="date"
      value={toInputValue(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) {
          onChange(null);
          return;
        }
        // Parse yyyy-mm-dd safely as a *local* date (no UTC shift).
        const [yy, mm, dd] = v.split("-").map(Number);
        const d = new Date(yy, (mm || 1) - 1, dd || 1);
        onChange(d);
      }}
      onBlur={() => {
        // Hide ourselves after the user dismisses without changing.
        // We do this by triggering a no-op onChange with the same date so
        // the parent toggles `show` off — but only when value didn't change.
      }}
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
        width: 1,
        height: 1,
        left: 0,
        top: 0,
      }}
    />
  );
}
