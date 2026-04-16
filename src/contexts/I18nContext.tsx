"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Locale =
  | "en"
  | "ms"
  | "zh"
  | "th"
  | "my"
  | "ko"
  | "ja"
  | "hi"
  | "ta"
  | "ar"
  | "ru"
  | "it";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18N_STORAGE_KEY = "dashboard_locale";

const baseEnglishTranslations: Record<string, string> = {
  "lang.label": "Language",
  "lang.en": "English",
  "lang.ms": "Bahasa Malaysia",
  "lang.zh": "Chinese",
  "lang.th": "Thai",
  "lang.my": "Myanmar",
  "lang.ko": "Korean",
  "lang.ja": "Japanese",
  "lang.hi": "Hindi",
  "lang.ta": "Tamil",
  "lang.ar": "Arabic",
  "lang.ru": "Russian",
  "lang.it": "Italian",

  "sidebar.group.dashboard": "Dashboard",
  "sidebar.group.botManagement": "Bot Management",
  "sidebar.group.automation": "Automation",
  "sidebar.group.business": "Business Tools",
  "sidebar.group.account": "Account",

  "sidebar.item.overview": "Overview",
  "sidebar.item.users": "Users",
  "sidebar.item.logs": "Logs",
  "sidebar.item.channels": "Channels",
  "sidebar.item.botSettings": "Bot Settings",
  "sidebar.item.groups": "Groups",
  "sidebar.item.broadcast": "Broadcast",
  "sidebar.item.autoReply": "Auto Reply",
  "sidebar.item.segments": "Segments",
  "sidebar.item.moderation": "Moderation",
  "sidebar.item.livegram": "Livegram",
  "sidebar.item.affiliates": "Affiliates",
  "sidebar.item.affiliateSettings": "Affiliate Settings",
  "sidebar.item.leads": "Leads",
  "sidebar.item.analytics": "Analytics",
  "sidebar.item.botMenu": "Bot Menu",
  "sidebar.item.profile": "Profile",
  "sidebar.item.settings": "Settings",
};

const translations: Record<Locale, Record<string, string>> = {
  en: baseEnglishTranslations,
  ms: {
    "lang.label": "Bahasa",
    "lang.en": "Inggeris",
    "lang.ms": "Bahasa Malaysia",

    "sidebar.group.dashboard": "Papan Pemuka",
    "sidebar.group.botManagement": "Pengurusan Bot",
    "sidebar.group.automation": "Automasi",
    "sidebar.group.business": "Alat Perniagaan",
    "sidebar.group.account": "Akaun",

    "sidebar.item.overview": "Gambaran Keseluruhan",
    "sidebar.item.users": "Pengguna",
    "sidebar.item.logs": "Log",
    "sidebar.item.channels": "Saluran",
    "sidebar.item.botSettings": "Tetapan Bot",
    "sidebar.item.groups": "Kumpulan",
    "sidebar.item.broadcast": "Siaran",
    "sidebar.item.autoReply": "Auto Balas",
    "sidebar.item.segments": "Segmen",
    "sidebar.item.moderation": "Moderasi",
    "sidebar.item.livegram": "Livegram",
    "sidebar.item.affiliates": "Afiliasi",
    "sidebar.item.affiliateSettings": "Tetapan Afiliasi",
    "sidebar.item.leads": "Prospek",
    "sidebar.item.analytics": "Analitik",
    "sidebar.item.botMenu": "Menu Bot",
    "sidebar.item.profile": "Profil",
    "sidebar.item.settings": "Tetapan",
  },
  zh: baseEnglishTranslations,
  th: baseEnglishTranslations,
  my: baseEnglishTranslations,
  ko: baseEnglishTranslations,
  ja: baseEnglishTranslations,
  hi: baseEnglishTranslations,
  ta: baseEnglishTranslations,
  ar: baseEnglishTranslations,
  ru: baseEnglishTranslations,
  it: baseEnglishTranslations,
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "ms";
  }

  const stored = window.localStorage.getItem(I18N_STORAGE_KEY) as Locale | null;
  if (stored && stored in translations) {
    return stored;
  }

  const browserLang = window.navigator.language.toLowerCase();
  if (browserLang.startsWith("ms") || browserLang.startsWith("id")) {
    return "ms";
  }

  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(I18N_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const table = translations[locale] || translations.ms;
      const fallbackTable = translations.en;

      return table[key] ?? fallbackTable[key] ?? key;
    },
    [locale]
  );

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}