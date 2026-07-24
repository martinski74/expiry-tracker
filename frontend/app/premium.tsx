import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import Purchases, {
  PurchasesPackage,
  PURCHASES_ERROR_CODE
} from "react-native-purchases";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../src/theme/ThemeProvider";
import { useI18n } from "../src/i18n/I18nProvider";
import { spacing, fontSize, radius } from "../src/theme/colors";
import { fontFamilyForWeight } from "../src/theme/fonts";
import { triggerHaptic } from "../src/utils/haptics";

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [premiumPackage, setPremiumPackage] = useState<PurchasesPackage | null>(
    null
  );

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        const offerings = await Purchases.getOfferings();

        if (offerings.current !== null) {
          // Търсим lifetime пакет от RevenueCat
          if (offerings.current.lifetime !== null) {
            setPremiumPackage(offerings.current.lifetime);
          } else if (offerings.current.availablePackages.length > 0) {
            setPremiumPackage(offerings.current.availablePackages[0]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch offerings:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!premiumPackage) return;
    triggerHaptic("medium");

    try {
      setPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);

      if (customerInfo.entitlements.active["premium"] !== undefined) {
        Alert.alert(t("premium.successTitle"), t("premium.successMessage"));
        router.back();
      }
    } catch (e: any) {
      if (e.userCancelled) {
        // Потребителят сам е затворил диалога — не е грешка.
      } else if (
        e.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR
      ) {
        // Продуктът вече е притежаван от този акаунт (напр. license tester,
        // или предишна покупка) — синхронизираме реалния статус вместо
        // да показваме грешка на потребител, който вече е платил.
        try {
          const customerInfo = await Purchases.restorePurchases();
          if (customerInfo.entitlements.active["premium"] !== undefined) {
            Alert.alert(t("premium.successTitle"), t("premium.successMessage"));
            router.back();
          } else {
            Alert.alert(
              t("premium.errorTitle"),
              t("premium.paymentErrorMessage")
            );
          }
        } catch {
          Alert.alert(
            t("premium.errorTitle"),
            t("premium.paymentErrorMessage")
          );
        }
      } else {
        Alert.alert(t("premium.errorTitle"), t("premium.paymentErrorMessage"));
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      triggerHaptic("light");
      const customerInfo = await Purchases.restorePurchases();
      const premiumEntitlement = customerInfo.entitlements.active["premium"];

      if (premiumEntitlement?.isActive) {
        Alert.alert(
          t("premium.restoreSuccessTitle"),
          t("premium.restoreSuccessMessage")
        );
        router.back();
      } else {
        Alert.alert(
          t("premium.noSubscriptionTitle"),
          t("premium.noSubscriptionMessage")
        );
      }
    } catch (error: any) {
      console.error("Restore Purchases error:", error);
      if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        Alert.alert(
          t("premium.paymentPendingTitle"),
          t("premium.paymentPendingMessage")
        );
      } else {
        Alert.alert(t("premium.errorTitle"), t("premium.restoreErrorMessage"));
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  const renderTitle = () => {
    const title = t("premium.title");
    const parts = title.split("Premium");
    if (parts.length === 2) {
      return (
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {parts[0]}
          <Text style={{ color: "#FF7E67" }}>Premium</Text>
          {parts[1]}
        </Text>
      );
    }
    return (
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
    );
  };

  const FeatureItem = ({
    icon,
    title,
    desc
  }: {
    icon: string;
    title: string;
    desc: string;
  }) => (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIconContainer,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(224, 122, 95, 0.06)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(224, 122, 95, 0.12)"
          }
        ]}
      >
        <Ionicons name={icon as any} size={22} color="#FF7E67" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.onSurface }]}>
          {title}
        </Text>
        <Text style={[styles.featureDesc, { color: colors.onSurfaceTertiary }]}>
          {desc}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ["#291d35ff", "#3d2d29ff"] : ["#FFFDFB", "#F3EFEA"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Close Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.closeIconButton,
          {
            top: insets.top + spacing.sm,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)"
          }
        ]}
      >
        <Ionicons name="close" size={20} color={colors.onSurface} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 50,
            paddingBottom: Math.max(insets.bottom + spacing.xl, 40)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Icon Card */}
        <View style={styles.heroContainer}>
          <View
            style={[
              styles.heroIconWrapper,
              {
                backgroundColor: isDark ? "#1F1B1A" : "#FFFFFF",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.06)"
              }
            ]}
          >
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.heroImage}
              contentFit="contain"
            />
          </View>
        </View>

        {renderTitle()}
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          {t("premium.subtitle")}
        </Text>

        {/* Features list */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="infinite-outline"
            title={t("premium.features.unlimited")}
            desc={t("premium.features.unlimitedDesc")}
          />
          <FeatureItem
            icon="checkmark-circle-outline"
            title={t("premium.features.lifetimeAccess")}
            desc={t("premium.features.lifetimeAccessDesc")}
          />
          <FeatureItem
            icon="heart-outline"
            title={t("premium.features.supportDev")}
            desc={t("premium.features.supportDevDesc")}
          />
        </View>

        {/* Pricing Card */}
        {premiumPackage ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#231C1B" : "#FFFFFF",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.05)"
              }
            ]}
          >
            {/* Floating Badge */}
            <View style={styles.badgeContainer}>
              <LinearGradient
                colors={["#FF9D7E", "#FF7A5C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badgeGradient}
              >
                <Text style={styles.badgeText}>★ LIFETIME</Text>
              </LinearGradient>
            </View>

            <Text style={[styles.period, { color: colors.onSurfaceTertiary }]}>
              {t("premium.oneTimePayment").toUpperCase()}
            </Text>

            <Text
              style={[styles.price, { color: colors.onSurface }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {premiumPackage.product.priceString}
            </Text>

            {/* CTA Buy Button with Arrow */}
            <TouchableOpacity
              style={styles.buyButtonContainer}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              <LinearGradient
                colors={["#FF9D7E", "#FF7A5C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyButtonGradient}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.buyButtonContent}>
                    <Text style={styles.buyButtonText}>
                      {t("premium.activateNow")}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#FFFFFF"
                      style={styles.buyButtonArrow}
                    />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noOffersContainer}>
            <Text style={{ color: colors.onSurfaceTertiary }}>
              {t("premium.noOffers")}
            </Text>
          </View>
        )}

        {/* Restore purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreButton}
          disabled={purchasing}
        >
          <Ionicons
            name="refresh"
            size={16}
            color="#FF7E67"
            style={styles.restoreIcon}
          />
          <Text style={styles.restoreText}>
            {t("premium.restorePurchases")}
          </Text>
        </TouchableOpacity>

        {/* Security / Footer text */}
        <View style={styles.footerContainer}>
          <Ionicons
            name="lock-closed"
            size={12}
            color={colors.onSurfaceTertiary}
            style={styles.footerLockIcon}
          />
          <Text
            style={[styles.footerText, { color: colors.onSurfaceTertiary }]}
          >
            {t("premium.securePayment")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    alignItems: "center"
  },
  closeIconButton: {
    position: "absolute",
    right: spacing.xl,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  heroContainer: {
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8
  },
  heroIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  heroImage: {
    width: "100%",
    height: "100%"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: fontFamilyForWeight("800"),
    textAlign: "center",
    marginBottom: spacing.sm
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fontFamilyForWeight("500"),
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 22
  },
  featuresContainer: {
    width: "100%",
    marginBottom: spacing.md,
    gap: spacing.md
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%"
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: spacing.md
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fontFamilyForWeight("700")
  },
  featureDesc: {
    fontSize: 14,
    fontFamily: fontFamilyForWeight("400"),
    marginTop: 2,
    lineHeight: 18
  },
  card: {
    width: "100%",
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    marginTop: spacing.xl,
    position: "relative"
  },
  badgeContainer: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    zIndex: 5
  },
  badgeGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    fontFamily: fontFamilyForWeight("900")
  },
  period: {
    fontSize: 13,
    fontFamily: fontFamilyForWeight("700"),
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: spacing.sm
  },
  price: {
    fontSize: 36,
    fontFamily: fontFamilyForWeight("800"),
    fontWeight: "800",
    marginBottom: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.sm
  },
  buyButtonContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF7A5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4
  },
  buyButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  buyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: fontFamilyForWeight("800"),
    fontWeight: "800"
  },
  buyButtonArrow: {
    marginLeft: spacing.sm
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    padding: spacing.sm
  },
  restoreIcon: {
    marginRight: 6
  },
  restoreText: {
    fontSize: 14,
    color: "#FF7E67",
    fontFamily: fontFamilyForWeight("600"),
    fontWeight: "600",
    textDecorationLine: "underline"
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    opacity: 0.6
  },
  footerLockIcon: {
    marginRight: 6
  },
  footerText: {
    fontSize: 12,
    fontFamily: fontFamilyForWeight("500"),
    textAlign: "center"
  },
  noOffersContainer: {
    padding: spacing.xl,
    alignItems: "center"
  }
});
