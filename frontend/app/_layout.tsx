import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { DbProvider } from "../src/db/DbProvider";
import { applyDefaultFontFamily, useAppFonts } from "../src/theme/fonts";
import { loadHapticsPreference } from "../src/preferences/hapticsPreference";

SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

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

  if (!fontsLoaded) {
    return null;
  }

  return (
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
              </Stack>
            </DbProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
