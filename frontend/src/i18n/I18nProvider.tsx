import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18n } from "i18n-js";
import { translations, Locale } from "./translations";

const STORAGE_KEY = "@expiry_tracker/locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (loc: Locale) => Promise<void>;
  t: (key: string, options?: object) => string;
  isReady: boolean;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectInitialLocale(): Locale {
  try {
    const locales = Localization.getLocales();
    const code = (locales?.[0]?.languageCode || "en").toLowerCase();
    return code === "bg" ? "bg" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const i18n = useMemo(() => {
    const inst = new I18n(translations);
    inst.enableFallback = true;
    inst.defaultLocale = "en";
    inst.locale = detectInitialLocale();
    return inst;
  }, []);

  const [locale, setLocaleState] = useState<Locale>(i18n.locale as Locale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Locale | null;
        if (stored === "en" || stored === "bg") {
          i18n.locale = stored;
          setLocaleState(stored);
        }
      } catch {
        // ignore
      } finally {
        setIsReady(true);
      }
    })();
  }, [i18n]);

  const setLocale = useCallback(
    async (loc: Locale) => {
      i18n.locale = loc;
      setLocaleState(loc);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, loc);
      } catch {
        // ignore
      }
    },
    [i18n]
  );

  const t = useCallback(
    (key: string, options?: object) => i18n.t(key, options),
    [i18n, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, isReady }),
    [locale, setLocale, t, isReady]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
