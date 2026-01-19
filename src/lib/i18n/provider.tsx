"use client";

import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import { config } from "@/config";
import { locales, defaultLocale, type Locale } from "./config";

// Import messages statically
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";

const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  hi: hiMessages,
};

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const TranslationContext = React.createContext<TranslationContextValue | undefined>(undefined);

interface TranslationProviderProps {
  children: React.ReactNode;
}

/**
 * Translation provider that integrates next-intl with localStorage persistence
 */
export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(defaultLocale);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Load saved locale on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(config.storage.localeKey) as Locale;
    if (saved && locales.includes(saved)) {
      setLocaleState(saved);
    }
    setIsHydrated(true);
  }, []);

  // Update locale and persist to localStorage
  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(config.storage.localeKey, newLocale);
    // Update html lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  // Update html lang on locale change
  React.useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = locale;
    }
  }, [locale, isHydrated]);

  const contextValue = React.useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  // Show nothing until hydrated to prevent mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages[locale]}
        timeZone="Asia/Kolkata"
      >
        {children}
      </NextIntlClientProvider>
    </TranslationContext.Provider>
  );
}

/**
 * Hook to access translation context
 */
export function useLocale(): TranslationContextValue {
  const context = React.useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a TranslationProvider");
  }
  return context;
}
