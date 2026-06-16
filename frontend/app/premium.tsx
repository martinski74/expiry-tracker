import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from '../src/theme/ThemeProvider';
import { useI18n } from '../src/i18n/I18nProvider';
import { spacing, fontSize, radius } from '../src/theme/colors';
import { fontFamilyForWeight } from '../src/theme/fonts';
import { triggerHaptic } from '../src/utils/haptics';

export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [premiumPackage, setPremiumPackage] = useState<PurchasesPackage | null>(null);
  
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current !== null) {
          if (offerings.current.annual !== null) {
            setPremiumPackage(offerings.current.annual);
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
      
      if (customerInfo.entitlements.active['premium'] !== undefined) {
        Alert.alert(t("premium.successTitle"), t("premium.successMessage"));
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
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
      const premiumEntitlement = customerInfo.entitlements.active['premium']; 
      
      if (premiumEntitlement?.isActive) {
        Alert.alert(t("premium.restoreSuccessTitle"), t("premium.restoreSuccessMessage"));
        router.back();
      } else {
        Alert.alert(t("premium.noSubscriptionTitle"), t("premium.noSubscriptionMessage"));
      }
    } catch (error: any) {
      console.error("Restore Purchases error:", error);
      Alert.alert(t("premium.errorTitle"), t("premium.restoreErrorMessage"));
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

  const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.brandPrimary + '15' }]}>
        <Ionicons name={icon as any} size={20} color={colors.brandPrimary} />
      </View>
      <Text style={[styles.featureText, { color: colors.onSurface }]}>{text}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Top Close Button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={[styles.closeIconButton, { top: insets.top + spacing.md }]}
      >
        <Ionicons name="close" size={28} color={colors.onSurfaceTertiary} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Image 
          source={require('../assets/images/icon.png')} // Changed to app icon for better branding
          style={styles.heroImage} 
          contentFit="contain" 
        />
        
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("premium.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>{t("premium.subtitle")}</Text>

        <View style={styles.featuresContainer}>
          <FeatureItem icon="infinite-outline" text={t("premium.features.unlimited")} />
          <FeatureItem icon="notifications-outline" text={t("premium.features.notifications")} />
          <FeatureItem icon="grid-outline" text={t("premium.features.categories")} />
          <FeatureItem icon="heart-outline" text={t("premium.features.support")} />
        </View>

        {premiumPackage ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
              <Text style={[styles.badgeText, { color: colors.onBrandPrimary }]}>BEST VALUE</Text>
            </View>
            
            <Text style={[styles.period, { color: colors.onSurfaceTertiary }]}>{t("premium.annualSubscription")}</Text>
            <Text style={[styles.price, { color: colors.onSurface }]}>
              {premiumPackage.product.priceString}
              <Text style={styles.pricePeriod}> {t("premium.perYear")}</Text>
            </Text> 
            
            <TouchableOpacity 
              style={[styles.buyButton, { backgroundColor: colors.brandPrimary }]} 
              onPress={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color={colors.onBrandPrimary} />
              ) : (
                <Text style={[styles.buyButtonText, { color: colors.onBrandPrimary }]}>{t("premium.activateNow")}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noOffersContainer}>
            <Text style={{ color: colors.onSurfaceTertiary }}>{t("premium.noOffers")}</Text>
          </View>
        )}

        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton} disabled={purchasing}>
          <Text style={[styles.restoreText, { color: colors.brandPrimary }]}>{t("premium.restorePurchases")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  closeIconButton: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.xs,
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    fontFamily: fontFamilyForWeight('800'),
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: { 
    fontSize: 16, 
    fontFamily: fontFamilyForWeight('500'),
    textAlign: 'center', 
    marginBottom: spacing["2xl"], 
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: spacing["2xl"],
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamilyForWeight('600'),
  },
  card: { 
    width: '100%', 
    padding: spacing.xl, 
    borderRadius: radius.lg, 
    borderWidth: 1, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: spacing.md,
  },
  badge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  period: { 
    fontSize: 14, 
    fontFamily: fontFamilyForWeight('600'),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  price: { 
    fontSize: 36, 
    fontFamily: fontFamilyForWeight('800'),
    fontWeight: '800', 
    marginBottom: spacing.xl,
  },
  pricePeriod: {
    fontSize: 18,
    fontWeight: '500',
  },
  buyButton: { 
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: radius.pill, 
    alignItems: 'center', 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buyButtonText: { 
    fontSize: 18, 
    fontFamily: fontFamilyForWeight('800'),
    fontWeight: '800', 
  },
  restoreButton: { 
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  restoreText: { 
    fontSize: 14,
    fontFamily: fontFamilyForWeight('600'),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  noOffersContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  }
});
