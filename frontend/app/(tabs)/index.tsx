import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { getAllDocuments, DocumentRow } from "../../src/db/documents";
import {
  getUrgency,
  urgencyColors,
  formatExpiryDate
} from "../../src/utils/urgency";
import { triggerHaptic } from "../../src/utils/haptics";
import { fontFamilyForWeight } from "../../src/theme/fonts";
import { usePremium } from "../../src/hooks/usePremium";
const heroDark = require("../../assets/images/hero-img-dark.png");
const heroLight = require("../../assets/images/hero-img-light.png");

type FilterKey = "all" | "soon" | "expired";

const PREDEFINED_KEYS = ["documents", "insurance", "warranties", "other"];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [docs, setDocs] = useState<DocumentRow[] | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = useWindowDimensions();
  const heroSize = Math.min(width * 0.56, height * 0.23, 230);

  const load = useCallback(async () => {
    const rows = await getAllDocuments();
    setDocs(rows);
  }, []);

  const onRefresh = useCallback(async () => {
    triggerHaptic("light");
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (!docs) return [];
    let list = docs;

    // Apply urgency filter
    if (filter !== "all") {
      list = list.filter((d) => {
        const u = getUrgency(d.expiry_date, t);
        if (filter === "expired") return u.level === "expired";
        if (filter === "soon")
          return u.level === "soon" || u.level === "warning";
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [docs, filter, searchQuery, t]);

  const heroImg = isDark ? heroDark : heroLight;

  const renderCard = (item: DocumentRow, index: number) => {
    const u = getUrgency(item.expiry_date, t);
    const ub = urgencyColors(u.level, colors);
    const catLabel =
      item.category_name && PREDEFINED_KEYS.includes(item.category_name)
        ? t(`categories.predefined.${item.category_name}`)
        : (item.category_name ?? t("common.uncategorized"));
    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(index * 50).duration(400)}
        exiting={FadeOut.duration(300)}
        layout={Layout.springify()}
      >
        <Pressable
          testID={`doc-card-${item.id}`}
          onPress={() => router.push(`/document/${item.id}`)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1
            }
          ]}
        >
          {item.image_uri ? (
            <Image
              source={{ uri: item.image_uri }}
              style={[
                styles.cardThumb,
                {
                  borderColor:
                    (item.category_color || colors.brandPrimary) + "55"
                }
              ]}
            />
          ) : (
            <View
              style={[
                styles.cardIcon,
                {
                  backgroundColor:
                    (item.category_color || colors.brandPrimary) + "22"
                }
              ]}
            >
              <Ionicons
                name={(item.category_icon as any) || "document-text-outline"}
                size={22}
                color={item.category_color || colors.brandPrimary}
              />
            </View>
          )}
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text
              numberOfLines={1}
              style={[styles.cardTitle, { color: colors.onSurface }]}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.cardMeta, { color: colors.onSurfaceTertiary }]}
            >
              {catLabel} · {formatExpiryDate(item.expiry_date, locale)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: ub.bg }]}>
            <Text
              style={[styles.badgeText, { color: ub.fg }]}
              numberOfLines={1}
            >
              {u.label}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const Chips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {(
        [
          { key: "all", label: t("home.filterAll") },
          { key: "soon", label: t("home.filterExpiringSoon") },
          { key: "expired", label: t("home.filterExpired") }
        ] as { key: FilterKey; label: string }[]
      ).map((c) => {
        const active = filter === c.key;
        return (
          <Pressable
            key={c.key}
            testID={`filter-${c.key}`}
            onPress={() => {
              triggerHaptic("selection");
              setFilter(c.key);
            }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active
                  ? colors.brandPrimary
                  : colors.surfaceSecondary,
                borderColor: active ? colors.brandPrimary : colors.border,
                opacity: pressed ? 0.85 : 1
              }
            ]}
          >
            <Text
              style={{
                color: active ? colors.onBrandPrimary : colors.onSurface,
                fontWeight: "700",
                fontSize: fontSize.sm
              }}
            >
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderBody = () => {
    if (docs === null) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      );
    }
    if (docs.length === 0) {
      return (
        <View
          style={[styles.emptyWrap, { paddingBottom: insets.bottom + 80 }]}
          testID="home-empty-state"
        >
          <Image
            source={heroImg}
            style={[
              styles.emptyImg,
              {
                width: heroSize,
                height: heroSize
              }
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("home.emptyTitle")}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.onSurfaceTertiary }]}>
            {t("home.emptyDescription")}
          </Text>
          <Pressable
            testID="empty-cta"
            onPress={() => router.push("/document/new")}
            style={({ pressed }) => [
              styles.emptyCta,
              {
                backgroundColor: colors.brandPrimary,
                opacity: pressed ? 0.9 : 1
              }
            ]}
          >
            <Ionicons name="add" size={18} color={colors.onBrandPrimary} />
            <Text
              style={{
                color: colors.onBrandPrimary,
                fontWeight: "800",
                fontSize: fontSize.base
              }}
            >
              {t("home.addButton")}
            </Text>
          </Pressable>
        </View>
      );
    }
    if (filtered.length === 0) {
      return (
        <View style={styles.emptyWrap} testID="home-empty-filtered">
          <Ionicons
            name="filter-outline"
            size={48}
            color={colors.onSurfaceTertiary}
          />
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.onSurface, marginTop: spacing.lg }
            ]}
          >
            {t("home.emptyFilteredTitle")}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.onSurfaceTertiary }]}>
            {t("home.emptyFilteredDescription")}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={filtered}
        keyExtractor={(d) => String(d.id)}
        renderItem={({ item, index }) => renderCard(item, index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 140,
          paddingTop: spacing.sm
        }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + spacing.lg
        }
      ]}
      testID="home-screen"
    >
      <View style={styles.header}>
        <View style={{ paddingRight: !isPremium ? 120 : 0 }}>
          <Text
            style={[styles.title, { color: colors.onSurface }]}
            testID="home-title"
          >
            {t("home.title")}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("home.subtitle")}
        </Text>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.onSurfaceTertiary}
          />
          <TextInput
            testID="home-search-input"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("common.searchPlaceholder") || "Search documents..."}
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.onSurfaceTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.chipContainer}>{Chips}</View>

      <View style={{ flex: 1 }}>{renderBody()}</View>

      {/* FAB */}
      {docs && docs.length > 0 && (
        <Pressable
          testID="home-fab"
          accessibilityLabel={t("home.addButton")}
          onPress={() => {
            triggerHaptic("medium");
            router.push("/document/new");
          }}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.brandPrimary,
              bottom: insets.bottom + 96,
              opacity: pressed ? 0.9 : 1,
              shadowColor: colors.onSurface
            }
          ]}
        >
          <Ionicons name="add" size={28} color={colors.onBrandPrimary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "800",
    fontFamily: fontFamilyForWeight("800"),
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    fontWeight: "500",
    fontFamily: fontFamilyForWeight("500")
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    gap: spacing.sm
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: "500"
  },
  chipContainer: { height: 56, justifyContent: "center" },
  chipsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    alignItems: "center"
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    marginRight: spacing.md,
    borderWidth: 1
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700"
  },
  cardMeta: {
    fontSize: fontSize.sm,
    marginTop: 2,
    fontWeight: "500"
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    maxWidth: 130
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl
  },
  emptyImg: { marginBottom: spacing.lg },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.xl
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm
  },
  emptyDesc: {
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320
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
    elevation: 6
  }
});
