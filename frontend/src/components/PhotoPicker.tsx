import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File, Directory, Paths } from "expo-file-system";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/I18nProvider";
import { spacing, fontSize, radius } from "../theme/colors";

type Props = {
  value: string | null;
  onChange: (uri: string | null) => void;
};

/**
 * Photo picker that:
 *  - Stores images as base64 data URIs (works on iOS/Android/web preview)
 *  - Requests camera / library permissions contextually
 *  - Falls back to "Open Settings" if permission is permanently denied
 */
export function PhotoPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [showActions, setShowActions] = useState(false);
  const [permIssue, setPermIssue] = useState<null | {
    message: string;
    canAsk: boolean;
  }>(null);

  const persistAsset = (asset: ImagePicker.ImagePickerAsset): string => {
    const dir = new Directory(Paths.document, "documents");
    if (!dir.exists) {
      dir.create();
    }
    const ext =
      asset.uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
    const filename = `photo_${Date.now()}_${Math.round(
      Math.random() * 1e6
    )}.${ext}`;
    const sourceFile = new File(asset.uri);
    const destFile = new File(dir, filename);
    sourceFile.copy(destFile);
    return destFile.uri;
  };

  const deleteFileIfLocal = (uri: string | null): void => {
    if (!uri || !uri.startsWith("file://")) return;
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch {
      // вече изтрит или недостъпен — игнорираме
    }
  };

  const handleCamera = async () => {
    setShowActions(false);
    setPermIssue(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setPermIssue({
        message: t("form.permissionMessageCamera"),
        canAsk: perm.canAskAgain
      });
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true
    });
    if (!res.canceled && res.assets?.[0]) {
      const newUri = persistAsset(res.assets[0]);
      deleteFileIfLocal(value);
      onChange(newUri);
    }
  };

  const handleLibrary = async () => {
    setShowActions(false);
    setPermIssue(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPermIssue({
        message: t("form.permissionMessageLibrary"),
        canAsk: perm.canAskAgain
      });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true
    });
    if (!res.canceled && res.assets?.[0]) {
      const newUri = persistAsset(res.assets[0]);
      deleteFileIfLocal(value);
      onChange(newUri);
    }
  };

  const handleRemove = async () => {
    setShowActions(false);
    deleteFileIfLocal(value);
    onChange(null);
  };

  return (
    <View>
      {value ? (
        <View
          style={[
            styles.preview,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceSecondary
            }
          ]}
          testID="photo-preview"
        >
          <Image source={{ uri: value }} style={styles.previewImg} />
          <View style={styles.previewActions}>
            <Pressable
              testID="photo-replace-btn"
              onPress={() => setShowActions((s) => !s)}
              style={({ pressed }) => [
                styles.smallBtn,
                {
                  backgroundColor: colors.surfaceTertiary,
                  opacity: pressed ? 0.8 : 1
                }
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={16}
                color={colors.onSurface}
              />
              <Text style={[styles.smallBtnText, { color: colors.onSurface }]}>
                {t("form.replacePhoto")}
              </Text>
            </Pressable>
            <Pressable
              testID="photo-remove-btn"
              onPress={handleRemove}
              style={({ pressed }) => [
                styles.smallBtn,
                {
                  backgroundColor: colors.error + "22",
                  opacity: pressed ? 0.8 : 1
                }
              ]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.smallBtnText, { color: colors.error }]}>
                {t("form.removePhoto")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          testID="photo-add-btn"
          onPress={() => setShowActions((s) => !s)}
          style={({ pressed }) => [
            styles.addBtn,
            {
              borderColor: colors.borderStrong,
              backgroundColor: colors.surfaceSecondary,
              opacity: pressed ? 0.85 : 1
            }
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color={colors.onSurfaceSecondary}
          />
          <Text
            style={{
              color: colors.onSurfaceSecondary,
              fontWeight: "700",
              fontSize: fontSize.base
            }}
          >
            {t("form.addPhoto")}
          </Text>
        </Pressable>
      )}

      {showActions ? (
        <View
          testID="photo-actions"
          style={[
            styles.actions,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border
            }
          ]}
        >
          <ActionRow
            testID="photo-action-camera"
            icon="camera"
            label={t("form.takePhoto")}
            onPress={handleCamera}
            colors={colors}
          />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <ActionRow
            testID="photo-action-gallery"
            icon="images"
            label={t("form.pickFromGallery")}
            onPress={handleLibrary}
            colors={colors}
          />
        </View>
      ) : null}

      {permIssue ? (
        <View
          testID="photo-perm-issue"
          style={[
            styles.permBox,
            {
              backgroundColor: colors.warning + "22",
              borderColor: colors.warning
            }
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={colors.onSurface}
          />
          <Text
            style={{
              flex: 1,
              color: colors.onSurface,
              fontSize: fontSize.sm,
              fontWeight: "500"
            }}
          >
            {permIssue.message}
          </Text>
          {!permIssue.canAsk ? (
            <Pressable
              testID="photo-open-settings"
              onPress={() => Linking.openSettings()}
              style={[
                styles.settingsBtn,
                { backgroundColor: colors.brandPrimary }
              ]}
            >
              <Text
                style={{
                  color: colors.onBrandPrimary,
                  fontWeight: "700",
                  fontSize: 12
                }}
              >
                {t("form.openSettings")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  colors,
  testID
}: {
  icon: any;
  label: string;
  onPress: () => void;
  colors: any;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        { opacity: pressed ? 0.6 : 1 }
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.brandPrimary} />
      <Text
        style={{
          color: colors.onSurface,
          fontWeight: "700",
          fontSize: fontSize.base
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  previewImg: {
    width: "100%",
    height: 200,
    resizeMode: "cover"
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill
  },
  smallBtnText: { fontSize: 13, fontWeight: "700" },
  addBtn: {
    minHeight: 100,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    flexDirection: "row"
  },
  actions: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
    overflow: "hidden"
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2
  },
  permBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm
  },
  settingsBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill
  }
});
