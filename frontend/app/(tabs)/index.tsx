import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const heroImg = isDark
    ? "https://static.prod-images.emergentagent.com/jobs/db37db30-127b-414f-92c0-57b21f69a8b8/images/c5a63f21c0b8b28d6ec44802fef8d6f09ed6c1ea2c15b6043455f3480d729d4a.png"
    : "https://static.prod-images.emergentagent.com/jobs/db37db30-127b-414f-92c0-57b21f69a8b8/images/0b3fd86df9a0d55cfa6641a05d1eb6c16da0ec45f4855adec61cf8d400e74a2f.png";

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + spacing.lg }]}
      testID="home-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]} testID="home-title">
          {t("home.title")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("home.subtitle")}
        </Text>
      </View>

      {/* Empty state */}
      <View style={styles.emptyWrap} testID="home-empty-state">
        <Image source={{ uri: heroImg }} style={styles.emptyImg} resizeMode="contain" />
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("home.emptyTitle")}
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.onSurfaceTertiary }]}>
          {t("home.emptyDescription")}
        </Text>
      </View>

      {/* FAB (placeholder — wired up in Step 4) */}
      <Pressable
        testID="home-fab"
        accessibilityLabel={t("home.addButton")}
        onPress={() => {
          // Step 4 will navigate to /document/new
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.brandPrimary,
            bottom: insets.bottom + (96),
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
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
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyImg: {
    width: 220,
    height: 220,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
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
