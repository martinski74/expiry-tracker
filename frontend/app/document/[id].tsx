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
import { File } from "expo-file-system";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../../src/theme/colors";
import { getAllCategories, Category } from "../../src/db/categories";
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  parseNotifyDays
} from "../../src/db/documents";
import { PhotoPicker } from "../../src/components/PhotoPicker";
import { DateField } from "../../src/components/DateField";
import {
  rescheduleForDocument,
  cancelForDocument,
  ensurePermission
} from "../../src/notifications/scheduler";
import { triggerHaptic } from "../../src/utils/haptics";
import { formatExpiryDate, parseLocalISODate } from "../../src/utils/urgency";

const REMINDER_OPTIONS: Array<{ days: number; key: string }> = [
  { days: 30, key: "30" },
  { days: 14, key: "14" },
  { days: 7, key: "7" },
  { days: 1, key: "1" },
  { days: 0, key: "0" }
];

const PREDEFINED_KEYS = ["documents", "insurance", "warranties", "other"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditDocumentScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [originalReminders, setOriginalReminders] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<{ title?: string; expiry?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      const cats = await getAllCategories();
      setCategories(cats);
      const doc = await getDocumentById(id);
      if (!doc) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      setTitle(doc.title);
      setCategoryId(doc.category_id);
      setExpiryDate(parseLocalISODate(doc.expiry_date));
      setNotes(doc.notes ?? "");
      setImageUri(doc.image_uri ?? null);
      const reminders = parseNotifyDays(doc.notify_days_before);
      setReminderDays(reminders);
      setOriginalReminders(reminders);
      setLoaded(true);
    })();
  }, [id]);

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
      await updateDocument(id, {
        title: title.trim(),
        category_id: categoryId,
        expiry_date: toISODate(expiryDate!),
        notes: notes.trim() || null,
        image_uri: imageUri,
        notify_days_before: reminderDays
      });
      // Update notifications to ensure title or expiry date changes are reflected
      if (reminderDays.length > 0) {
        const perm = await ensurePermission();
        if (perm.granted) {
          await rescheduleForDocument({
            docId: id,
            title: title.trim(),
            expiryISO: toISODate(expiryDate!),
            reminderDays,
            previousReminderDays: originalReminders,
            notifTitleTemplate: t("form.notifTitleSoon"),
            bodyTemplates: {
              today: t("form.notifBodyToday"),
              tomorrow: t("form.notifBodyTomorrow"),
              daysTemplate: t("form.notifBodyDays")
            }
          });
        }
      } else if (originalReminders.length > 0) {
        // User disabled all reminders
        await cancelForDocument(id, originalReminders);
      }

      triggerHaptic("success");
      router.back();
    } catch (e) {
      console.error("[Update] failed:", e);
      triggerHaptic("error");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      triggerHaptic("medium");
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3500);
      return;
    }
    try {
      await cancelForDocument(id, originalReminders);
      await deleteDocument(id);
      if (imageUri && imageUri.startsWith("file://")) {
        try {
          const file = new File(imageUri);
          if (file.exists) file.delete();
        } catch {
          // вече изтрит или недостъпен
        }
      }
      triggerHaptic("success");
      router.back();
    } catch (e) {
      console.error("[Delete] failed:", e);
      triggerHaptic("error");
    }
  };

  if (!loaded) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.surface }]}
        testID="edit-loading"
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t("form.editTitle"),
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.onSurface
          }}
        />
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (notFound) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.surface }]}
        testID="edit-not-found"
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t("form.editTitle"),
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.onSurface
          }}
        />
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.onSurfaceTertiary}
        />
        <Text
          style={{
            color: colors.onSurface,
            marginTop: spacing.md,
            fontWeight: "700",
            fontSize: fontSize.lg
          }}
        >
          {t("form.notFound")}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.surface }]}
      testID="edit-doc-screen"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("form.editTitle"),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: "800", fontSize: fontSize.lg }
        }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 200
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
                borderColor: errors.title ? colors.error : colors.border
              }
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
          <DateField
            value={expiryDate}
            onChange={(d) => {
              setExpiryDate(d);
              if (d && errors.expiry)
                setErrors((e) => ({ ...e, expiry: undefined }));
            }}
            placeholder={t("form.pickDate")}
            locale={locale}
            error={!!errors.expiry}
            clearLabel={t("form.clear")}
            testID="field-expiry"
          />
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
                borderColor: colors.border
              }
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
                  onPress={() => {
                    triggerHaptic("selection");
                    setReminderDays((curr) =>
                      curr.includes(opt.days)
                        ? curr.filter((d) => d !== opt.days)
                        : [...curr, opt.days].sort((a, b) => b - a)
                    );
                  }}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active
                        ? colors.brandPrimary
                        : colors.surfaceSecondary,
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
          <Text
            style={{
              color: colors.onSurfaceTertiary,
              fontSize: 12,
              marginTop: spacing.sm,
              fontWeight: "500"
            }}
          >
            {t("form.reminderHint")}
          </Text>
        </Field>

        {/* Delete button */}
        <Pressable
          testID="delete-btn"
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              borderColor: confirmingDelete
                ? colors.error
                : colors.borderStrong,
              backgroundColor: confirmingDelete
                ? colors.error + "15"
                : "transparent",
              opacity: pressed ? 0.7 : 1
            }
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={confirmingDelete ? colors.error : colors.onSurfaceSecondary}
          />
          <Text
            style={{
              color: confirmingDelete
                ? colors.error
                : colors.onSurfaceSecondary,
              fontWeight: "700",
              fontSize: fontSize.base
            }}
          >
            {confirmingDelete ? t("form.deleteConfirm") : t("form.delete")}
          </Text>
        </Pressable>
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
          testID="save-btn"
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

function CatChip({
  label,
  active,
  onPress,
  colors,
  icon,
  tint,
  testID
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
  icon: any;
  tint: string;
  testID: string;
}) {
  const handlePress = () => {
    triggerHaptic("selection");
    onPress();
  };
  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.catChip,
        {
          backgroundColor: active
            ? colors.brandPrimary
            : colors.surfaceSecondary,
          borderColor: active ? colors.brandPrimary : colors.border,
          opacity: pressed ? 0.85 : 1
        }
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
          fontSize: fontSize.sm
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  textArea: { minHeight: 96, textAlignVertical: "top" },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    marginTop: spacing.sm
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
