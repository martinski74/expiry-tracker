import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { addCustomCategory, getAllCategories } from "../../src/db/categories";
import { usePremium } from "../../src/hooks/usePremium";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { FREE_PLAN_LIMITS } from "../../src/config/limits";

// Curated icon + color palettes that fit the warm theme.
const ICON_OPTIONS = [
  "card-outline",
  "car-outline",
  "home-outline",
  "heart-outline",
  "fitness-outline",
  "airplane-outline",
  "school-outline",
  "briefcase-outline",
  "wallet-outline",
  "gift-outline",
  "key-outline",
  "leaf-outline",
  "medkit-outline",
  "musical-notes-outline",
  "paw-outline",
  "tv-outline"
] as const;

const COLOR_OPTIONS = [
  "#DD5A3A", // terracotta (brand)
  "#F08A3E", // amber
  "#E4B363", // warm gold
  "#829C7F", // sage
  "#7CA1A6", // muted teal
  "#A5523C", // brick
  "#D46F6F", // dusty red
  "#9C7E6F" // taupe
];

export default function NewCategoryScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t("categories.nameRequired"));
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const categories = await getAllCategories();

      const customCategoryCount = categories.filter(
        (category) => !category.is_predefined
      ).length;

      if (
        !isPremium &&
        customCategoryCount >= FREE_PLAN_LIMITS.customCategories
      ) {
        setSaving(false);

        Alert.alert(
          t("premium.categoryLimitTitle"),
          t("premium.categoryLimitMessage"),
          [
            {
              text: t("common.cancel"),
              style: "cancel"
            },
            {
              text: t("common.goPremium"),
              onPress: () => router.push("/premium")
            }
          ]
        );

        return;
      }

      await addCustomCategory({
        name: name.trim(),
        icon,
        color
      });

      router.back();
    } catch (e) {
      console.error("[Save category] failed:", e);
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.surface }]}
      testID="new-category-screen"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("categories.newTitle"),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: "800", fontSize: fontSize.lg }
        }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 140
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Live preview */}
        <View
          style={[
            styles.preview,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
          testID="cat-preview"
        >
          <View style={[styles.previewIcon, { backgroundColor: color + "22" }]}>
            <Ionicons name={icon as any} size={28} color={color} />
          </View>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: "700",
              color: colors.onSurface
            }}
            numberOfLines={1}
          >
            {name.trim() || t("categories.fieldNamePlaceholder")}
          </Text>
        </View>

        {/* Name */}
        <Field label={t("categories.fieldName")} error={error} colors={colors}>
          <TextInput
            testID="cat-field-name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (error) setError(undefined);
            }}
            placeholder={t("categories.fieldNamePlaceholder")}
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[
              styles.input,
              {
                color: colors.onSurface,
                backgroundColor: colors.surfaceSecondary,
                borderColor: error ? colors.error : colors.border
              }
            ]}
          />
        </Field>

        {/* Icon */}
        <Field label={t("categories.fieldIcon")} colors={colors}>
          <View style={styles.grid}>
            {ICON_OPTIONS.map((opt) => {
              const active = icon === opt;
              return (
                <Pressable
                  key={opt}
                  testID={`cat-icon-${opt}`}
                  onPress={() => setIcon(opt)}
                  style={({ pressed }) => [
                    styles.iconCell,
                    {
                      backgroundColor: active
                        ? color + "22"
                        : colors.surfaceSecondary,
                      borderColor: active ? color : colors.border,
                      borderWidth: active ? 2 : 1,
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                >
                  <Ionicons
                    name={opt as any}
                    size={22}
                    color={active ? color : colors.onSurfaceSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </Field>

        {/* Color */}
        <Field label={t("categories.fieldColor")} colors={colors}>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => {
              const active = color === c;
              return (
                <Pressable
                  key={c}
                  testID={`cat-color-${c}`}
                  onPress={() => setColor(c)}
                  style={({ pressed }) => [
                    styles.colorDot,
                    {
                      backgroundColor: c,
                      borderColor: active ? colors.onSurface : "transparent",
                      borderWidth: active ? 3 : 0,
                      opacity: pressed ? 0.8 : 1
                    }
                  ]}
                />
              );
            })}
          </View>
        </Field>
      </ScrollView>

      {/* Sticky save bar */}
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + spacing.md
          }
        ]}
      >
        <Pressable
          testID="cat-save-btn"
          disabled={saving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.brandPrimary,
              opacity: pressed || saving ? 0.85 : 1
            }
          ]}
        >
          <Ionicons name="checkmark" size={20} color={colors.onBrandPrimary} />
          <Text style={[styles.saveTxt, { color: colors.onBrandPrimary }]}>
            {t("common.save")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  colors,
  children
}: {
  label: string;
  error?: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={[styles.fieldLabel, { color: colors.onSurfaceSecondary }]}>
        {label}
      </Text>
      {children}
      {error ? (
        <Text style={[styles.fieldError, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  fieldError: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  colorDot: {
    width: 44,
    height: 44,
    borderRadius: radius.pill
  },
  saveBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2
  },
  saveTxt: { fontSize: fontSize.lg, fontWeight: "800" }
});
