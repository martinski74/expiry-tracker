import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { useI18n } from "../../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../../src/theme/colors";
import { getDocumentsByCategory, DocumentRow } from "../../../src/db/documents";
import { getCategoryById, Category } from "../../../src/db/categories";
import {
  getUrgency,
  urgencyColors,
  formatExpiryDate,
} from "../../../src/utils/urgency";
import { triggerHaptic } from "../../../src/utils/haptics";

const PREDEFINED_KEYS = ["documents", "insurance", "warranties", "other"];

export default function CategoryFilteredScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const [docs, setDocs] = useState<DocumentRow[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([
      getDocumentsByCategory(id),
      getCategoryById(id),
    ]);
    setDocs(d);
    setCategory(c);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    triggerHaptic("light");
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const categoryTitle = useMemo(() => {
    if (!category) return "";
    if (category.is_predefined && PREDEFINED_KEYS.includes(category.name)) {
      return t(`categories.predefined.${category.name}`);
    }
    return category.name;
  }, [category, t]);

  const renderCard = (item: DocumentRow, index: number) => {
    const u = getUrgency(item.expiry_date, t);
    const ub = urgencyColors(u.level, colors);
    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(index * 50).duration(400)}
        exiting={FadeOut.duration(300)}
        layout={Layout.springify()}
      >
        <Pressable
          onPress={() => router.push(`/document/${item.id}`)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {item.image_uri ? (
            <Image
              source={{ uri: item.image_uri }}
              style={styles.cardThumb}
            />
          ) : (
            <View
              style={[
                styles.cardIcon,
                {
                  backgroundColor:
                    (category?.color || colors.brandPrimary) + "22",
                },
              ]}
            >
              <Ionicons
                name={(category?.icon as any) || "document-text-outline"}
                size={22}
                color={category?.color || colors.brandPrimary}
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
              {formatExpiryDate(item.expiry_date, locale)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: ub.bg }]}>
            <Text style={[styles.badgeText, { color: ub.fg }]} numberOfLines={1}>
              {u.label}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (!category && docs === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: categoryTitle,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: "800", fontSize: fontSize.lg },
          headerRight: () =>
            category && !category.is_predefined ? (
              <Pressable
                onPress={() => router.push(`/category/${category.id}`)}
                style={{ marginRight: spacing.md }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.onSurface} />
              </Pressable>
            ) : null,
        }}
      />

      {docs && docs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colors.onSurfaceTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("home.emptyFilteredTitle")}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.onSurfaceTertiary }]}>
            {t("home.emptyFilteredDescription")}
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: "/document/new", params: { categoryId: id } })}
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
              {t("home.addButton")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={docs}
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
            paddingBottom: insets.bottom + spacing.xl,
            paddingTop: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  cardMeta: {
    fontSize: fontSize.sm,
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    maxWidth: 130,
  },
  badgeText: {
    fontSize: 12,
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
});
