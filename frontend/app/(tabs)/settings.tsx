import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { Locale } from "../../src/i18n/translations";
import { getAllDocuments } from "../../src/db/documents";
import { daysUntil } from "../../src/utils/urgency";
import { STORAGE_KEYS, useStoredValue } from "../../src/hooks/useStoredValue";
import {
  getDefaultHapticsEnabled,
  syncHapticsCache
} from "../../src/preferences/hapticsPreference";
import { triggerHaptic } from "../../src/utils/haptics";
import { fontFamilyForWeight } from "../../src/theme/fonts";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { usePremium } from "../../src/hooks/usePremium";

const REMINDER_OPTIONS: Array<{ days: number; key: string }> = [
  { days: 30, key: "30" },
  { days: 14, key: "14" },
  { days: 7, key: "7" },
  { days: 1, key: "1" },
  { days: 0, key: "0" }
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 });
  const [defaults, setDefaults] = useStoredValue<number[]>(
    STORAGE_KEYS.defaultReminders,
    [30, 7, 1]
  );
  const [hapticsOn, setHapticsOn] = useStoredValue<boolean>(
    STORAGE_KEYS.hapticsEnabled,
    getDefaultHapticsEnabled()
  );

  const handleHapticsToggle = async (value: boolean) => {
    triggerHaptic("selection");
    syncHapticsCache(value);
    await setHapticsOn(value);
  };

  const loadStats = useCallback(async () => {
    const docs = await getAllDocuments();
    let expiring = 0;
    let expired = 0;
    for (const d of docs) {
      const days = daysUntil(d.expiry_date);
      if (days < 0) expired++;
      else if (days <= 30) expiring++;
    }
    setStats({ total: docs.length, expiring, expired });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  React.useEffect(() => {
    syncHapticsCache(hapticsOn);
  }, [hapticsOn]);

  const LangButton = ({ value, label }: { value: Locale; label: string }) => {
    const active = locale === value;
    return (
      <Pressable
        testID={`lang-btn-${value}`}
        onPress={() => {
          triggerHaptic("selection");
          setLocale(value);
        }}
        style={({ pressed }) => [
          styles.langBtn,
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
            fontSize: fontSize.base
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const StatCell = ({
    value,
    label,
    color,
    testID
  }: {
    value: number;
    label: string;
    color: string;
    testID: string;
  }) => (
    <View style={styles.statCell} testID={testID}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.onSurfaceTertiary }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + spacing.lg
        }
      ]}
      testID="settings-screen"
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.onSurface }]}
          testID="settings-title"
        >
          {t("settings.title")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("settings.subtitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 120
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium status */}
        <Pressable
          onPress={() => {
            if (!isPremium) {
              triggerHaptic("selection");
              router.push("/premium");
            }
          }}
          style={({ pressed }) => [
            styles.card,
            { position: "relative" },
            {
              backgroundColor: isPremium
                ? colors.brandPrimary + "10"
                : colors.surfaceSecondary,
              borderColor: isPremium ? colors.success : colors.border,
              borderWidth: isPremium ? 1.5 : 1,
              opacity: pressed && !isPremium ? 0.85 : 1
            }
          ]}
        >
          {isPremium && !isPremiumLoading && (
            <View
              style={[
                styles.lifetimeBadge,
                { backgroundColor: colors.brandTertiary }
              ]}
            >
              <Text
                style={[
                  styles.lifetimeBadgeText,
                  { color: colors.onBrandTertiary }
                ]}
              >
                LIFETIME
              </Text>
            </View>
          )}
          <View style={styles.cardHead}>
            {/* Иконка */}
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isPremium
                    ? colors.success + "25"
                    : colors.surfaceTertiary
                }
              ]}
            >
              <Ionicons
                name={isPremium ? "sparkles" : "diamond-outline"}
                size={20}
                color={isPremium ? colors.success : colors.onSurfaceTertiary}
              />
            </View>

            {/* Текстова част */}
            <View style={{ flex: 1, paddingRight: spacing.xs - 3 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.onSurface, fontSize: fontSize.base }
                ]}
                numberOfLines={1}
              >
                {isPremium
                  ? t("settings.premiumLifetimeTitle")
                  : t("settings.freePlanTitle")}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.onSurfaceTertiary,
                  fontWeight: "500",
                  marginTop: 2
                }}
              >
                {isPremium
                  ? t("settings.premiumLifetimeSubtitle")
                  : t("settings.freePlanSubtitle")}
              </Text>
            </View>

            {/* Десен елемент (Бутон за покупка ИЛИ Бадж за активен достъп) */}
            {isPremium && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  backgroundColor: colors.brandPrimary + "20",
                  paddingHorizontal: spacing.md - 2,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.pill
                }}
              >
                <Ionicons
                  name="checkmark-sharp"
                  size={14}
                  color={colors.success}
                />
                <Text
                  style={{
                    color: colors.success,
                    fontSize: fontSize.sm + 1,
                    fontWeight: "700"
                  }}
                >
                  {t("settings.statusActive")}
                </Text>
              </View>
            )}
          </View>

          {/* CTA бутон за безплатен план — на отделен ред, за да не притиска заглавието */}
          {!isPremium && (
            <View
              style={[
                styles.premiumAction,
                { backgroundColor: colors.brandPrimary, alignSelf: "stretch" }
              ]}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={colors.onBrandPrimary}
              />
              <Text
                style={[
                  styles.premiumActionText,
                  { color: colors.onBrandPrimary }
                ]}
              >
                {t("settings.premiumUpgrade")}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.onBrandPrimary}
              />
            </View>
          )}
        </Pressable>
        {/* ============================================================================== */}
        {/* Stats card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
          testID="settings-stats"
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary }
              ]}
            >
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color={colors.brandPrimary}
              />
            </View>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t("settings.stats")}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <StatCell
              value={stats.total}
              label={t("settings.statsTotal")}
              color={colors.onSurface}
              testID="stat-total"
            />
            <View
              style={[styles.statDivider, { backgroundColor: colors.divider }]}
            />
            <StatCell
              value={stats.expiring}
              label={t("settings.statsExpiring")}
              color={colors.brandPrimary}
              testID="stat-expiring"
            />
            <View
              style={[styles.statDivider, { backgroundColor: colors.divider }]}
            />
            <StatCell
              value={stats.expired}
              label={t("settings.statsExpired")}
              color={colors.error}
              testID="stat-expired"
            />
          </View>
        </View>

        {/* Language */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary }
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

        {/* Haptics */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
          testID="settings-haptics"
        >
          <View style={styles.hapticsRow}>
            <View style={styles.hapticsLabel}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.brandTertiary }
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={colors.brandPrimary}
                />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.onSurface, flexShrink: 1 }
                ]}
              >
                {t("settings.haptics")}
              </Text>
            </View>
            <Switch
              testID="haptics-switch"
              value={hapticsOn}
              onValueChange={handleHapticsToggle}
              trackColor={{
                false: colors.surfaceTertiary,
                true: colors.brandPrimary
              }}
              thumbColor={
                Platform.OS === "android" ? colors.onBrandPrimary : undefined
              }
            />
          </View>
        </View>

        {/* Default reminders */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary }
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.brandPrimary}
              />
            </View>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t("settings.defaultReminders")}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
          >
            {REMINDER_OPTIONS.map((opt) => {
              const active = defaults.includes(opt.days);
              return (
                <Pressable
                  key={opt.key}
                  testID={`default-reminder-${opt.days}`}
                  onPress={() => {
                    triggerHaptic("selection");
                    setDefaults(
                      active
                        ? defaults.filter((d) => d !== opt.days)
                        : [...defaults, opt.days].sort((a, b) => b - a)
                    );
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: active
                        ? colors.brandPrimary
                        : colors.surfaceTertiary,
                      borderColor: active ? colors.brandPrimary : colors.border,
                      opacity: pressed ? 0.85 : 1
                    }
                  ]}
                >
                  <Ionicons
                    name={active ? "checkmark-circle" : "notifications-outline"}
                    size={16}
                    color={
                      active ? colors.onBrandPrimary : colors.onSurfaceTertiary
                    }
                  />
                  <Text
                    style={{
                      color: active ? colors.onBrandPrimary : colors.onSurface,
                      fontWeight: "700",
                      fontSize: fontSize.sm
                    }}
                  >
                    {t(`form.reminderDays_${opt.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[styles.cardHint, { color: colors.onSurfaceTertiary }]}>
            {t("settings.defaultRemindersHint")}
          </Text>
        </View>

        {/* About */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.cardHead}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandTertiary }
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
            <Text
              style={[styles.aboutLabel, { color: colors.onSurfaceTertiary }]}
            >
              {t("settings.version")}
            </Text>
            <Text style={[styles.aboutValue, { color: colors.onSurface }]}>
              {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
          <Text
            style={{
              color: colors.onSurfaceTertiary,
              fontSize: fontSize.sm,
              fontStyle: "italic",
              marginTop: spacing.sm
            }}
          >
            {t("settings.madeWith")}
          </Text>
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
    fontFamily: fontFamilyForWeight("800"),
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    fontWeight: "500",
    fontFamily: fontFamilyForWeight("500")
  },
  hapticsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  hapticsLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexShrink: 1,
    marginRight: spacing.md
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  lifetimeBadge: {
    position: "absolute",
    top: -9,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    zIndex: 1
  },
  lifetimeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  premiumCard: {
    padding: spacing.lg
  },
  premiumCardHead: {
    marginBottom: 0
  },
  premiumLifetime: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginTop: spacing.xs
  },
  premiumAction: {
    minHeight: 40,
    alignSelf: "center",
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  premiumActionText: {
    fontSize: fontSize.base,
    fontWeight: "700",
    fontFamily: fontFamilyForWeight("700")
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    fontFamily: fontFamilyForWeight("700")
  },
  cardHint: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginTop: spacing.sm
  },
  langRow: { flexDirection: "row", gap: spacing.md },
  langBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center"
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  statCell: { flex: 1, alignItems: "center", paddingVertical: spacing.xs - 3 },
  statValue: { fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  statDivider: { width: 1, marginVertical: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 38
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  aboutLabel: { fontSize: fontSize.base, fontWeight: "500" },
  aboutValue: { fontSize: fontSize.base, fontWeight: "700" }
});
