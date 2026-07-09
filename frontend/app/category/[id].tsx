import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { getCategoryById, updateCategory } from "../../src/db/categories";
import { triggerHaptic } from "../../src/utils/haptics";

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
  "pricetag-outline"
] as const;

const COLOR_OPTIONS = [
  "#DD5A3A",
  "#F08A3E",
  "#E4B363",
  "#829C7F",
  "#7CA1A6",
  "#A5523C",
  "#D46F6F",
  "#9C7E6F"
];

export default function EditCategoryScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const cat = await getCategoryById(id);
      if (!cat || cat.is_predefined) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      setName(cat.name);
      setIcon(cat.icon);
      setColor(cat.color);
      setLoaded(true);
    })();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t("categories.nameRequired"));
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await updateCategory(id, { name: name.trim(), icon, color });
      triggerHaptic("success");
      router.back();
    } catch (e) {
      console.error("[Update category] failed:", e);
      triggerHaptic("error");
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.onSurfaceTertiary}
        />
        <Text
          style={{
            color: colors.onSurface,
            marginTop: spacing.md,
            fontWeight: "700"
          }}
        >
          Category not found or cannot be edited
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.surface }]}
      testID="edit-category-screen"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("common.edit"),
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
                  onPress={() => {
                    triggerHaptic("selection");
                    setIcon(opt);
                  }}
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
                  onPress={() => {
                    triggerHaptic("selection");
                    setColor(c);
                  }}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
