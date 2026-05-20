import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { Locale } from "../../src/i18n/translations";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();

  const LangButton = ({
    value,
    label,
  }: {
    value: Locale;
    label: string;
  }) => {
    const active = locale === value;
    return (
      <Pressable
        testID={`lang-btn-${value}`}
        onPress={() => setLocale(value)}
        style={({ pressed }) => [
          styles.langBtn,
          {
            backgroundColor: active
              ? colors.brandPrimary
              : colors.surfaceSecondary,
            borderColor: active ? colors.brandPrimary : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: active ? colors.onBrandPrimary : colors.onSurface,
            fontWeight: "700",
            fontSize: fontSize.base,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + spacing.lg }]}
      testID="settings-screen"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]} testID="settings-title">
          {t("settings.title")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("settings.subtitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary },
              ]}
            >
              <Ionicons
                name="language-outline"
                size={20}
                color={colors.brandPrimary}
              />
            </View>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t("settings.language")}
            </Text>
          </View>
          <View style={styles.langRow}>
            <LangButton value="en" label={t("settings.languageEnglish")} />
            <LangButton value="bg" label={t("settings.languageBulgarian")} />
          </View>
        </View>

        {/* Notifications (placeholder, will be wired in Step 8) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.brandPrimary}
              />
            </View>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t("settings.notifications")}
            </Text>
          </View>
          <Text style={[styles.cardHint, { color: colors.onSurfaceTertiary }]}>
            {t("common.comingSoon")}
          </Text>
        </View>

        {/* About */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.brandPrimary}
              />
            </View>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t("settings.about")}
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.onSurfaceTertiary }]}>
              {t("settings.version")}
            </Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>
              1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  cardHint: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  langBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutLabel: { fontSize: fontSize.base, fontWeight: "500" },
  aboutValue: { fontSize: fontSize.base, fontWeight: "700" },
});
