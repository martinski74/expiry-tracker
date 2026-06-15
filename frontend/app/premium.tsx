import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';
import {darkTheme as colors} from '../src/theme/colors'
import { useI18n } from '../src/i18n/I18nProvider';


export default function PremiumScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [premiumPackage, setPremiumPackage] = useState<PurchasesPackage | null>(null);
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    // Вземане на офертата "default" и пакета ни от RevenueCat
    const fetchOfferings = async () => {
      try {
        setLoading(true);
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current !== null) {
        // Първо проверяваме дали има заложен годишен пакет
          if (offerings.current.annual !== null) {
            setPremiumPackage(offerings.current.annual);
          } 
        // Ако няма, но има налични пакети, взимаме първия наличен (обикновено твоя абонамент)
        else if (offerings.current.availablePackages.length > 0) {
          setPremiumPackage(offerings.current.availablePackages[0]);
        }
      }
      } catch (e) {
        console.error("Неуспешно извличане на оферти:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!premiumPackage) return;

    try {
      setPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
      
      if (customerInfo.entitlements.active['premium'] !== undefined) {
        Alert.alert(t("premium.successTitle"), t("premium.successMessage"));
        router.back(); // Връща потребителя обратно
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
    const customerInfo = await Purchases.restorePurchases();
    console.log('Active entitlements:', customerInfo.entitlements.active);
    // По-точна проверка
    const premiumEntitlement = customerInfo.entitlements.active['premium']; 
    
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
    Alert.alert(
      t("premium.errorTitle"), 
      t("premium.restoreErrorMessage")
    );
  } finally {
    setPurchasing(false);
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={ require('../assets/images/empty-documents-dark.png') }
        style={styles.illustration} 
        contentFit="contain" 
        transition={500} // Лека анимация при зареждане
      />
      <Text style={styles.title}>{t("premium.title")}</Text>
      <Text style={styles.subtitle}>{t("premium.subtitle")}</Text>

      {premiumPackage ? (
        <View style={styles.card}>
          <Text style={styles.period}>{t("premium.annualSubscription")}</Text>
          {/* Динамичната цена от Google Play (напр. "19.99 лв. / година") */}
          <Text style={styles.price}>{premiumPackage.product.priceString} {t("premium.perYear")}</Text> 
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{t("premium.activateNow")}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <Text>{t("premium.noOffers")}</Text>
      )}

      <TouchableOpacity onPress={handleRestore} style={styles.restoreButton} disabled={purchasing}>
        <Text style={styles.restoreText}>{t("premium.restorePurchases")}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
        <Text style={styles.closeText}>{t("premium.close")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
 container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: colors.surface 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { 
    fontSize: 28, // Малко по-голям за премиум усещане
    fontWeight: '700', 
    fontFamily: 'Nunito', // Прилагаме Nunito
    color: colors.onSurface, 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 16, 
    fontFamily: 'Nunito',
    color: '#a3958e', 
    textAlign: 'center', 
    marginBottom: 32, 
    paddingHorizontal: 20 
  },
  card: { 
    width: '100%', 
    padding: 24, 
    borderRadius: 20, // Използваме 'lg' токена за radius
    backgroundColor: '#FFFFFF', // Чисто бяло за фокус
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2 // За Android
  },
  period: { 
    fontSize: 18, 
    fontFamily: 'Nunito',
    color: '#d6bea9',
    fontWeight: '600' 
  },
  price: { 
    fontSize: 32, 
    fontFamily: 'Nunito',
    fontWeight: '800', 
    color: colors.success, // Топъл зелен тон от guidelines
    marginVertical: 12 
  },
  button: { 
    width: '100%', 
    paddingVertical: 16, 
    borderRadius: 999, // Използваме 'pill' токена за модерна форма
    backgroundColor: colors.brandPrimary, // Твоят бранд цвят
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { 
    color: colors.onBrandPrimary, 
    fontSize: 16, 
    fontFamily: 'Nunito',
    fontWeight: '700' 
  },
  restoreButton: { marginTop: 24 },
  restoreText: { 
    color: '#a3928d', 
    fontFamily: 'Nunito',
    textDecorationLine: 'underline' 
  },
  closeButton: { marginTop: 32 },
  closeText: { 
    color: colors.error, // Твоят цвят за грешка
    fontFamily: 'Nunito',
    fontWeight: '600' 
  },
  illustration: {
    width: 120,    // Регулирай размера според дизайна
    height: 100,
    borderRadius: 20,
    marginBottom: 20,
  },
});