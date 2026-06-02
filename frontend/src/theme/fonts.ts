import { Platform, Text, TextInput } from "react-native";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

export const fonts = {
  regular: "Nunito_400Regular",
  semiBold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
} as const;

/** Web uses the Google Fonts family name from +html.tsx */
export const webFontFamily = "Nunito, system-ui, sans-serif";

export function fontFamilyForWeight(
  weight?: string | number | null
): string {
  if (Platform.OS === "web") return webFontFamily;
  const w =
    weight === "bold"
      ? 700
      : typeof weight === "string"
        ? parseInt(weight, 10)
        : weight;
  if (w != null && !Number.isNaN(w)) {
    if (w >= 800) return fonts.extraBold;
    if (w >= 700) return fonts.bold;
    if (w >= 600) return fonts.semiBold;
  }
  return fonts.regular;
}

let defaultsApplied = false;

/** Set Nunito as the default font for Text / TextInput (native). */
export function applyDefaultFontFamily(): void {
  if (defaultsApplied || Platform.OS === "web") return;
  defaultsApplied = true;

  const family = fonts.regular;
  const textDefaults = (Text as unknown as { defaultProps?: { style?: object } })
    .defaultProps;
  (Text as unknown as { defaultProps?: { style?: object } }).defaultProps = {
    ...textDefaults,
    style: [{ fontFamily: family }, textDefaults?.style],
  };

  const inputDefaults = (
    TextInput as unknown as { defaultProps?: { style?: object } }
  ).defaultProps;
  (TextInput as unknown as { defaultProps?: { style?: object } }).defaultProps =
    {
      ...inputDefaults,
      style: [{ fontFamily: family }, inputDefaults?.style],
    };
}

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  return Platform.OS === "web" ? true : loaded;
}
