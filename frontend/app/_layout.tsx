import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import Purchases from 'react-native-purchases';
import { PremiumProvider } from '../src/hooks/usePremium';
import { I18nProvider } from "../src/i18n/I18nProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { DbProvider } from "../src/db/DbProvider";
import { applyDefaultFontFamily, useAppFonts } from "../src/theme/fonts";
import { loadHapticsPreference } from "../src/preferences/hapticsPreference";

const API_KEY = 'goog_bHrWkUdUFJREGvwwxOiLixjiXmo';

SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [rcConfigured, setRcConfigured] = useState(false);

  useEffect(() => {
    // Инициализиране на RevenueCat при стартиране на приложението
    if (API_KEY){
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); // Помага да виждаш какво се случва в терминала
      Purchases.configure({ apiKey: API_KEY });
    }
    setRcConfigured(true);
  }, []);

  useEffect(() => {
    // Изчиства баджа при отваряне на приложението
    Notifications.setBadgeCountAsync(0);
  }, []);

  useEffect(() => {
    loadHapticsPreference();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFontFamily();
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !rcConfigured) {
    return null;
  }

  return (
    <PremiumProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <I18nProvider>
              <DbProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="document/new"
                    options={{ presentation: "modal", headerShown: true }}
                  />
                  <Stack.Screen
                    name="document/[id]"
                    options={{ headerShown: true }}
                  />      
                  <Stack.Screen
                    name="category/new"
                    options={{ presentation: "modal", headerShown: true }}
                  />
                  {/* ДОБАВЕНО: Твоят нов Paywall екран като Modal */}
                  <Stack.Screen
                    name="premium"
                    options={{ 
                      presentation: "modal", 
                      headerShown: false // Скриваме хедъра, за да си ползваш твоя дизайн
                    }}
                  />
                </Stack>
              </DbProvider>
            </I18nProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PremiumProvider>
  );
}
