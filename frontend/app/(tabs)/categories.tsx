import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { getAllCategories, Category } from "../../src/db/categories";

const PREDEFINED_KEYS = ["documents", "insurance", "warranties", "other"];

function hexWithAlpha(hex: string, alpha: number): string {
  // simple #RRGGBB → rgba()
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CategoriesScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [cats, setCats] = useState<Category[] | null>(null);

  const load = useCallback(async () => {
    const rows = await getAllCategories();
    setCats(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const labelFor = (c: Category): string => {
    if (c.is_predefined && PREDEFINED_KEYS.includes(c.name)) {
      return t(`categories.predefined.${c.name}`);
    }
    return c.name;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top + spacing.lg },
      ]}
      testID="categories-screen"
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.onSurface }]}
          testID="categories-title"
        >
          {t("categories.title")}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}
        >
          {t("categories.subtitle")}
        </Text>
      </View>

      {cats === null ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {cats.map((cat) => (
            <View
              key={cat.id}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
              testID={`category-row-${cat.id}`}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: hexWithAlpha(
                      cat.color,
                      isDark ? 0.22 : 0.14
                    ),
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={22}
                  color={cat.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.rowTitle, { color: colors.onSurface }]}
                >
                  {labelFor(cat)}
                </Text>
                <Text
                  style={[
                    styles.rowMeta,
                    { color: colors.onSurfaceTertiary },
                  ]}
                >
                  {cat.document_count ?? 0} ·{" "}
                  {cat.is_predefined ? t("common.comingSoon") : "custom"}
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
      )}
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
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
