import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import {
  getAllCategories,
  deleteCategory,
  Category,
} from "../../src/db/categories";

const PREDEFINED_KEYS = ["documents", "insurance", "warranties", "other"];

function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CategoriesScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

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

  const docsCountLabel = (n: number): string => {
    if (n === 0) return t("categories.docsCountZero");
    if (n === 1) return t("categories.docsCountOne");
    return t("categories.docsCount").replace("{n}", String(n));
  };

  const handleLongPress = (c: Category) => {
    if (c.is_predefined) return;
    setPendingDeleteId(c.id);
    setTimeout(() => {
      setPendingDeleteId((curr) => (curr === c.id ? null : curr));
    }, 4000);
  };

  const handleConfirmDelete = async (c: Category) => {
    await deleteCategory(c.id);
    setPendingDeleteId(null);
    await load();
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
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("categories.subtitle")}
        </Text>
      </View>

      {cats === null ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          {cats.map((cat) => {
            const isPending = pendingDeleteId === cat.id;
            return (
              <Pressable
                key={cat.id}
                testID={`category-row-${cat.id}`}
                onLongPress={() => handleLongPress(cat)}
                delayLongPress={400}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isPending
                      ? hexWithAlpha(colors.error, 0.1)
                      : colors.surfaceSecondary,
                    borderColor: isPending ? colors.error : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
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
                  <View style={styles.titleRow}>
                    <Text
                      style={[styles.rowTitle, { color: colors.onSurface }]}
                    >
                      {labelFor(cat)}
                    </Text>
                    {!cat.is_predefined && (
                      <View
                        style={[
                          styles.customBadge,
                          { backgroundColor: colors.brandTertiary },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: colors.onBrandTertiary,
                          }}
                        >
                          {t("categories.customBadge")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.rowMeta,
                      { color: colors.onSurfaceTertiary },
                    ]}
                  >
                    {docsCountLabel(cat.document_count ?? 0)}
                  </Text>
                </View>
                {isPending ? (
                  <Pressable
                    testID={`confirm-delete-${cat.id}`}
                    onPress={() => handleConfirmDelete(cat)}
                    style={[
                      styles.deletePill,
                      { backgroundColor: colors.error },
                    ]}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                    <Text style={styles.deletePillText}>
                      {t("common.delete")}
                    </Text>
                  </Pressable>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.onSurfaceTertiary}
                  />
                )}
              </Pressable>
            );
          })}

          <Text
            style={[styles.hint, { color: colors.onSurfaceTertiary }]}
            testID="categories-hint"
          >
            {t("categories.longPressHint")}
          </Text>
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        testID="categories-fab"
        accessibilityLabel={t("categories.addButton")}
        onPress={() => router.push("/category/new")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.brandPrimary,
            bottom: insets.bottom + 96,
            opacity: pressed ? 0.9 : 1,
            shadowColor: colors.onSurface,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={colors.onBrandPrimary} />
      </Pressable>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
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
  customBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  deletePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  deletePillText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  hint: {
    textAlign: "center",
    fontSize: fontSize.sm,
    marginTop: spacing.xl,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
