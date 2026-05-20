import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";

const PREDEFINED = [
  { key: "documents", icon: "document-text-outline" as const, tint: "#F9E6D8", tintDark: "#4D3A32" },
  { key: "insurance", icon: "shield-checkmark-outline" as const, tint: "#E6EFE5", tintDark: "#2F3D2E" },
  { key: "warranties", icon: "construct-outline" as const, tint: "#FBEFD6", tintDark: "#4A3F26" },
  { key: "other", icon: "ellipsis-horizontal-outline" as const, tint: "#EDE6E1", tintDark: "#3A322E" },
];

export default function CategoriesScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + spacing.lg }]}
      testID="categories-screen"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]} testID="categories-title">
          {t("categories.title")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("categories.subtitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {PREDEFINED.map((cat) => (
          <View
            key={cat.key}
            style={[
              styles.row,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            testID={`category-row-${cat.key}`}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isDark ? cat.tintDark : cat.tint },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={22}
                color={colors.brandPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.onSurface }]}>
                {t(`categories.predefined.${cat.key}`)}
              </Text>
              <Text style={[styles.rowMeta, { color: colors.onSurfaceTertiary }]}>
                0 {t("home.title").toLowerCase()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.onSurfaceTertiary}
            />
          </View>
        ))}

        <Text
          style={[styles.hint, { color: colors.onSurfaceTertiary }]}
          testID="categories-coming-soon"
        >
          {t("common.comingSoon")} · {t("categories.addButton")}
        </Text>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  rowMeta: {
    fontSize: fontSize.sm,
    marginTop: 2,
    fontWeight: "500",
  },
  hint: {
    textAlign: "center",
    fontSize: fontSize.sm,
    marginTop: spacing.xl,
    fontWeight: "500",
  },
});
