import React from "react";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, View, Text } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { GlassTabBarBackground } from "../../src/components/GlassTabBarBackground";
import { fontFamilyForWeight } from "../../src/theme/fonts";
import { triggerHaptic } from "../../src/utils/haptics";
import { usePremium } from '../../src/hooks/usePremium'
import { fontSize, radius, spacing } from "@/src/theme/colors";

function TabBarButton(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPress={(e) => {
        triggerHaptic("selection");
        props.onPress?.(e);
      }}
    />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isPremium } = usePremium();

  const tabBarBg =
    Platform.OS === "ios" ? "transparent" : colors.surfaceSecondary + "F2";

  const showPremiumShortcut = !isPremium && !pathname.endsWith("/settings");

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: tabBarBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : Math.max(insets.bottom, 8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          fontFamily: fontFamilyForWeight("600"),
        },
        tabBarButton: TabBarButton,
        sceneStyle: {
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("tabs.categories"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-categories",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-settings",
        }}
      />
    </Tabs>

    {/* Показва се само за non-premium потребители, без Settings таба */}
      {showPremiumShortcut && (
        <Pressable
          onPress={() => {
            triggerHaptic("medium");
            router.push("/premium");
          }}
          style={({ pressed }) => [
            styles.premiumButton,
            {
              backgroundColor: colors.brandPrimary,
              top: insets.top + spacing.lg,
              opacity: pressed ? 0.85 : 1,
              shadowColor: colors.brandPrimary,
            },
          ]}
        >
          <Ionicons name="star" size={12} color={colors.onBrandPrimary} />
          <Text style={[styles.premiumButtonText, { color: colors.onBrandPrimary }]}> 
            {t("common.goPremium")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  premiumButton: {
    position: "absolute",
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  premiumButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fontFamilyForWeight("700"),
  },
});