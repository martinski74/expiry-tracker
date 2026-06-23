// Warm earth-tone palette for ExpiryTracker
// Source of truth: /app/design_guidelines.json

export const lightTheme = {
  surface: "#FCFAF8",
  onSurface: "#38312E",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#544A46",
  surfaceTertiary: "#F3EFEA",
  onSurfaceTertiary: "#6D615C",
  surfaceInverse: "#38312E",
  onSurfaceInverse: "#FCFAF8",
  brand: "#E07A5F",
  brandPrimary: "#E07A5F",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#F08A3E",
  onBrandSecondary: "#38312E",
  brandTertiary: "#FBDFCC",
  onBrandTertiary: "#A5523C",
  success: "#829C7F",
  onSuccess: "#FFFFFF",
  warning: "#E4B363",
  onWarning: "#38312E",
  error: "#D46F6F",
  onError: "#FFFFFF",
  info: "#7CA1A6",
  onInfo: "#FFFFFF",
  border: "#E8E2DD",
  borderStrong: "#D1C7C0",
  divider: "#E8E2DD",
};

export const darkTheme = {
  surface: "#1F1B1A",
  onSurface: "#EBE5E0",
  surfaceSecondary: "#2B2524",
  onSurfaceSecondary: "#D1C7C0",
  surfaceTertiary: "#362E2D",
  onSurfaceTertiary: "#AFA39D",
  surfaceInverse: "#FCFAF8",
  onSurfaceInverse: "#1F1B1A",
  brand: "#dd6c4fff",
  brandPrimary: "#dd6f53ff",
  onBrandPrimary: "#1F1B1A",
  brandSecondary: "#F08A3E",
  onBrandSecondary: "#1F1B1A",
  brandTertiary: "#4D3A32",
  onBrandTertiary: "#F6C1B1",
  success: "#91B28D",
  onSuccess: "#1F1B1A",
  warning: "#F0C987",
  onWarning: "#1F1B1A",
  error: "#E28585",
  onError: "#1F1B1A",
  info: "#8BB6BC",
  onInfo: "#1F1B1A",
  border: "#362E2D",
  borderStrong: "#4D4340",
  divider: "#362E2D",
};

export type ThemeColors = typeof lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fontSize = {
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
};
