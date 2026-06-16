import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
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
  deleteCategoryAndDocuments,
  Category,
} from "../../src/db/categories";
import { triggerHaptic } from "../../src/utils/haptics";

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
  const [dialogCat, setDialogCat] = useState<Category | null>(null);

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
    triggerHaptic("medium");
    setPendingDeleteId(c.id);
    setTimeout(() => {
      setPendingDeleteId((curr) => (curr === c.id ? null : curr));
    }, 4000);
  };

  /** User tapped the red Delete pill → open the dialog */
  const handleDeletePress = (c: Category) => {
    triggerHaptic("warning");
    setPendingDeleteId(null);
    setDialogCat(c);
  };

  /** Dialog: keep docs (uncategorized) */
  const handleKeepDocs = async () => {
    if (!dialogCat) return;
    await deleteCategory(dialogCat.id);
    setDialogCat(null);
    await load();
  };

  /** Dialog: delete docs too */
  const handleDeleteAll = async () => {
    if (!dialogCat) return;
    triggerHaptic("error");
    await deleteCategoryAndDocuments(dialogCat.id);
    setDialogCat(null);
    await load();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyWrap} testID="categories-empty-state">
      <Ionicons
        name="grid-outline"
        size={64}
        color={colors.onSurfaceTertiary}
      />
      <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
        {t("categories.emptyTitle")}
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.onSurfaceTertiary }]}>
        {t("categories.emptyDescription")}
      </Text>
      <Pressable
        onPress={() => {
          triggerHaptic("medium");
          router.push("/category/new");
        }}
        style={({ pressed }) => [
          styles.emptyCta,
          {
            backgroundColor: colors.brandPrimary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={18} color={colors.onBrandPrimary} />
        <Text
          style={{
            color: colors.onBrandPrimary,
            fontWeight: "800",
            fontSize: fontSize.base,
          }}
        >
          {t("categories.addButton")}
        </Text>
      </Pressable>
    </View>
  );

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
      ) : cats.length === 0 ? (
        renderEmptyState()
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
            const hasExpired = (cat.expired_count ?? 0) > 0;
            const hasUrgent = (cat.urgent_count ?? 0) > 0;

            return (
              <Pressable
                key={cat.id}
                testID={`category-row-${cat.id}`}
                onPress={() => {
                  router.push(`/category/view/${cat.id}`);
                }}
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
                    {hasExpired && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: colors.error },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {cat.expired_count}
                        </Text>
                      </View>
                    )}
                    {hasUrgent && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: colors.brandPrimary },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {cat.urgent_count}
                        </Text>
                      </View>
                    )}
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
                    onPress={() => handleDeletePress(cat)}
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

      {/* Delete warning modal */}
      <Modal
        visible={dialogCat !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDialogCat(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDialogCat(null)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            {/* Icon */}
            <View style={[styles.modalIcon, { backgroundColor: hexWithAlpha(colors.error, 0.12) }]}>
              <Ionicons name="trash-outline" size={28} color={colors.error} />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              {t("categories.deleteConfirm")}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.modalDesc, { color: colors.onSurfaceTertiary }]}>
              {t("categories.deleteWarning")}
            </Text>

            {/* Action buttons */}
            <Pressable
              testID="modal-keep-docs"
              onPress={handleKeepDocs}
              style={({ pressed }) => [
                styles.modalBtn,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="folder-open-outline" size={18} color={colors.onSurface} />
              <Text style={[styles.modalBtnText, { color: colors.onSurface }]}>
                {t("categories.deleteKeepDocs")}
              </Text>
            </Pressable>

            <Pressable
              testID="modal-delete-all"
              onPress={handleDeleteAll}
              style={({ pressed }) => [
                styles.modalBtn,
                { backgroundColor: hexWithAlpha(colors.error, 0.1), borderColor: colors.error, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="trash" size={18} color={colors.error} />
              <Text style={[styles.modalBtnText, { color: colors.error }]}>
                {t("categories.deleteAllDocs")}
              </Text>
            </Pressable>

            {/* Cancel */}
            <Pressable
              testID="modal-cancel"
              onPress={() => setDialogCat(null)}
              style={({ pressed }) => [styles.modalCancel, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.modalCancelText, { color: colors.onSurfaceTertiary }]}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* FAB */}
      <Pressable
        testID="categories-fab"
        accessibilityLabel={t("categories.addButton")}
        onPress={() => {
          triggerHaptic("medium");
          router.push("/category/new");
        }}
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
        <Text style={[styles.fabLabel, { color: colors.onBrandPrimary }]}>
          {t("categories.addButton")}
        </Text>
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
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
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
    flexDirection: "row",
    gap: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
    fabLabel: {
    fontSize: fontSize.base,
    fontWeight: "700",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  modalDesc: {
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  modalBtnText: {
    fontSize: fontSize.base,
    fontWeight: "700",
    flex: 1,
  },
  modalCancel: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  modalCancelText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    textAlign: "center",
  },
});
