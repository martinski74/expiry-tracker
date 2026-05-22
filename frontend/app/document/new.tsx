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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { getAllCategories, Category } from "../../src/db/categories";
import { addDocument } from "../../src/db/documents";
import { formatExpiryDate } from "../../src/utils/urgency";
import { PhotoPicker } from "../../src/components/PhotoPicker";
import {
  ensurePermission,
  scheduleForDocument,
} from "../../src/notifications/scheduler";
import { STORAGE_KEYS, useStoredValue } from "../../src/hooks/useStoredValue";

const DEFAULT_REMINDERS = [30, 7, 1];
const REMINDER_OPTIONS: Array<{ days: number; key: string }> = [
  { days: 30, key: "30" },
  { days: 14, key: "14" },
  { days: 7, key: "7" },
  { days: 1, key: "1" },
];

const PREDEFINED_KEYS = ["documents", "insurance", "warranties", "other"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NewDocumentScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [issueDate, setIssueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [storedDefaults] = useStoredValue<number[]>(
    STORAGE_KEYS.defaultReminders,
    DEFAULT_REMINDERS
  );
  const [reminderDays, setReminderDays] = useState<number[]>(DEFAULT_REMINDERS);
  const [reminderInitialised, setReminderInitialised] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; expiry?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const rows = await getAllCategories();
      setCategories(rows);
    })();
  }, []);

  // Initialise reminder defaults from Settings the first time storedDefaults loads.
  useEffect(() => {
    if (!reminderInitialised && storedDefaults) {
      setReminderDays(storedDefaults);
      setReminderInitialised(true);
    }
  }, [storedDefaults, reminderInitialised]);

  const labelForCategory = (c: Category) =>
    c.is_predefined && PREDEFINED_KEYS.includes(c.name)
      ? t(`categories.predefined.${c.name}`)
      : c.name;

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = t("form.titleRequired");
    if (!expiryDate) next.expiry = t("form.expiryRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      const newId = await addDocument({
        title: title.trim(),
        category_id: categoryId,
        expiry_date: toISODate(expiryDate!),
        issue_date: issueDate ? toISODate(issueDate) : null,
        notes: notes.trim() || null,
        image_uri: imageUri,
        notify_days_before: reminderDays,
      });

      if (reminderDays.length > 0) {
        const perm = await ensurePermission();
        if (perm.granted) {
          await scheduleForDocument({
            docId: newId,
            title: title.trim(),
            expiryISO: toISODate(expiryDate!),
            reminderDays,
            notifTitleTemplate: t("form.notifTitleSoon"),
            bodyTemplates: {
              today: t("form.notifBodyToday"),
              tomorrow: t("form.notifBodyTomorrow"),
              daysTemplate: t("form.notifBodyDays"),
            },
          });
        }
      }

      router.back();
    } catch (e) {
      console.error("[Save] failed:", e);
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.surface }]}
      testID="new-doc-screen"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("form.newTitle"),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: "800", fontSize: fontSize.lg },
        }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Field
          label={t("form.fieldTitle")}
          error={errors.title}
          colors={colors}
        >
          <TextInput
            testID="field-title"
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
            }}
            placeholder={t("form.fieldTitlePlaceholder")}
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[
              styles.input,
              {
                color: colors.onSurface,
                backgroundColor: colors.surfaceSecondary,
                borderColor: errors.title ? colors.error : colors.border,
              },
            ]}
          />
        </Field>

        {/* Category */}
        <Field label={t("form.fieldCategory")} colors={colors}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
          >
            <CatChip
              label={t("form.noCategory")}
              active={categoryId === null}
              onPress={() => setCategoryId(null)}
              colors={colors}
              icon="remove-outline"
              tint={colors.onSurfaceTertiary}
              testID="cat-chip-none"
            />
            {categories.map((c) => (
              <CatChip
                key={c.id}
                label={labelForCategory(c)}
                active={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
                colors={colors}
                icon={c.icon as any}
                tint={c.color}
                testID={`cat-chip-${c.id}`}
              />
            ))}
          </ScrollView>
        </Field>

        {/* Expiry date */}
        <Field
          label={t("form.fieldExpiryDate")}
          error={errors.expiry}
          colors={colors}
        >
          <DateRow
            value={expiryDate}
            placeholder={t("form.pickDate")}
            colors={colors}
            locale={locale}
            error={!!errors.expiry}
            onPress={() => setShowExpiryPicker(true)}
            onClear={() => setExpiryDate(null)}
            clearLabel={t("form.clear")}
            testID="field-expiry"
          />
          {showExpiryPicker && (
            <DateTimePicker
              value={expiryDate ?? new Date()}
              mode="date"
              onChange={(_, d) => {
                setShowExpiryPicker(Platform.OS === "ios");
                if (d) {
                  setExpiryDate(d);
                  if (errors.expiry)
                    setErrors((e) => ({ ...e, expiry: undefined }));
                }
              }}
            />
          )}
        </Field>

        {/* Issue date */}
        <Field label={t("form.fieldIssueDate")} colors={colors}>
          <DateRow
            value={issueDate}
            placeholder={t("form.pickDate")}
            colors={colors}
            locale={locale}
            onPress={() => setShowIssuePicker(true)}
            onClear={() => setIssueDate(null)}
            clearLabel={t("form.clear")}
            testID="field-issue"
          />
          {showIssuePicker && (
            <DateTimePicker
              value={issueDate ?? new Date()}
              mode="date"
              onChange={(_, d) => {
                setShowIssuePicker(Platform.OS === "ios");
                if (d) setIssueDate(d);
              }}
            />
          )}
        </Field>

        {/* Notes */}
        <Field label={t("form.fieldNotes")} colors={colors}>
          <TextInput
            testID="field-notes"
            value={notes}
            onChangeText={setNotes}
            placeholder={t("form.fieldNotesPlaceholder")}
            placeholderTextColor={colors.onSurfaceTertiary}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              styles.textArea,
              {
                color: colors.onSurface,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          />
        </Field>

        {/* Photo */}
        <Field label={t("form.fieldPhoto")} colors={colors}>
          <PhotoPicker value={imageUri} onChange={setImageUri} />
        </Field>

        {/* Reminders */}
        <Field label={t("form.fieldReminders")} colors={colors}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
          >
            {REMINDER_OPTIONS.map((opt) => {
              const active = reminderDays.includes(opt.days);
              return (
                <Pressable
                  key={opt.key}
                  testID={`reminder-${opt.days}`}
                  onPress={() =>
                    setReminderDays((curr) =>
                      curr.includes(opt.days)
                        ? curr.filter((d) => d !== opt.days)
                        : [...curr, opt.days].sort((a, b) => b - a)
                    )
                  }
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active
                        ? colors.brandPrimary
                        : colors.surfaceSecondary,
                      borderColor: active
                        ? colors.brandPrimary
                        : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={active ? "checkmark-circle" : "notifications-outline"}
                    size={16}
                    color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary}
                  />
                  <Text
                    style={{
                      color: active ? colors.onBrandPrimary : colors.onSurface,
                      fontWeight: "700",
                      fontSize: fontSize.sm,
                    }}
                  >
                    {t(`form.reminderDays_${opt.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text
            style={{
              color: colors.onSurfaceTertiary,
              fontSize: 12,
              marginTop: spacing.sm,
              fontWeight: "500",
            }}
          >
            {t("form.reminderHint")}
          </Text>
        </Field>
      </ScrollView>

      {/* Sticky save bar */}
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <Pressable
          testID="save-btn"
          disabled={saving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.brandPrimary,
              opacity: pressed || saving ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color={colors.onBrandPrimary}
          />
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
  children,
}: {
  label: string;
  error?: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={[
          styles.fieldLabel,
          { color: colors.onSurfaceSecondary },
        ]}
      >
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

function CatChip({
  label,
  active,
  onPress,
  colors,
  icon,
  tint,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
  icon: any;
  tint: string;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.catChip,
        {
          backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
          borderColor: active ? colors.brandPrimary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? colors.onBrandPrimary : tint}
      />
      <Text
        style={{
          color: active ? colors.onBrandPrimary : colors.onSurface,
          fontWeight: "700",
          fontSize: fontSize.sm,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DateRow({
  value,
  placeholder,
  colors,
  locale,
  error,
  onPress,
  onClear,
  clearLabel,
  testID,
}: {
  value: Date | null;
  placeholder: string;
  colors: any;
  locale: string;
  error?: boolean;
  onPress: () => void;
  onClear: () => void;
  clearLabel: string;
  testID: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [
          styles.input,
          {
            flex: 1,
            backgroundColor: colors.surfaceSecondary,
            borderColor: error ? colors.error : colors.border,
            opacity: pressed ? 0.85 : 1,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={colors.onSurfaceTertiary}
        />
        <Text
          style={{
            color: value ? colors.onSurface : colors.onSurfaceTertiary,
            fontSize: fontSize.base,
            fontWeight: "500",
          }}
        >
          {value ? formatExpiryDate(value.toISOString(), locale) : placeholder}
        </Text>
      </Pressable>
      {value ? (
        <Pressable
          testID={`${testID}-clear`}
          onPress={onClear}
          style={[
            styles.clearBtn,
            { backgroundColor: colors.surfaceTertiary },
          ]}
        >
          <Text
            style={{
              color: colors.onSurfaceSecondary,
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            {clearLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldError: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
  },
  saveTxt: { fontSize: fontSize.lg, fontWeight: "800" },
});
