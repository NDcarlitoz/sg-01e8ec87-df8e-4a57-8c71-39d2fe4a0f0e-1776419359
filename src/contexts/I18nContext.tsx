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
  "sidebar.item.howToUse": "How to Use",

  "guide.title": "How to Use Bot",
  "guide.subtitle": "Complete tutorial to setup and use all Telegram bot features",
  "guide.gettingStarted.title": "Getting Started",
  "guide.gettingStarted.botToken.title": "Get Bot Token",
  "guide.gettingStarted.botToken.step1": "Open Telegram and search for @BotFather",
  "guide.gettingStarted.botToken.step2": "Send command /newbot",
  "guide.gettingStarted.botToken.step3": "Follow instructions to name your bot",
  "guide.gettingStarted.botToken.step4": "Copy the token provided (format: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)",
  "guide.gettingStarted.botToken.step5": "Go to Dashboard → Settings and paste token in 'Bot Token'",
  "guide.gettingStarted.webhook.title": "Setup Webhook",
  "guide.gettingStarted.webhook.step1": "After entering token, click 'Set Webhook'",
  "guide.gettingStarted.webhook.step2": "Wait until webhook status shows 'Active'",
  "guide.gettingStarted.webhook.step3": "Your bot can now receive messages!",

  "guide.addingBot.title": "Adding Bot to Groups/Channels",
  "guide.addingBot.groups.title": "For Groups:",
  "guide.addingBot.groups.step1": "Open your Telegram group",
  "guide.addingBot.groups.step2": "Tap group name → 'Edit' → 'Administrators'",
  "guide.addingBot.groups.step3": "Tap 'Add Admin' and search for your bot",
  "guide.addingBot.groups.step4": "Grant permissions: Delete Messages, Ban Users, Invite Users",
  "guide.addingBot.groups.step5": "Bot will appear in Dashboard → Groups",
  "guide.addingBot.channels.title": "For Channels:",
  "guide.addingBot.channels.step1": "Open your Telegram channel",
  "guide.addingBot.channels.step2": "Tap channel name → 'Administrators'",
  "guide.addingBot.channels.step3": "Tap 'Add Administrator' and select your bot",
  "guide.addingBot.channels.step4": "Grant permission 'Post Messages'",
  "guide.addingBot.channels.step5": "Bot will appear in Dashboard → Channels",

  "guide.broadcast.title": "Send Broadcast",
  "guide.broadcast.step1": "Go to Dashboard → Broadcast",
  "guide.broadcast.step2": "Select target type: Private (users), Groups, or Channels",
  "guide.broadcast.step3": "Write your message (formatting allowed: *bold*, _italic_)",
  "guide.broadcast.step4": "Optional: Attach image or document",
  "guide.broadcast.step5": "Choose 'Send Now' or schedule for later",
  "guide.broadcast.step6": "Monitor delivery status in 'History' tab",

  "guide.autoReply.title": "Setup Auto-Reply",
  "guide.autoReply.step1": "Go to Dashboard → Auto Reply",
  "guide.autoReply.step2": "Click 'Add Rule'",
  "guide.autoReply.step3": "Define trigger keyword (e.g., 'price', 'info', '/start')",
  "guide.autoReply.step4": "Choose match type: Exact, Contains, or Starts With",
  "guide.autoReply.step5": "Write reply message",
  "guide.autoReply.step6": "Select scope: All users, Specific groups, or Private chats only",
  "guide.autoReply.step7": "Save and activate rule",

  "guide.moderation.title": "Moderation & Security",
  "guide.moderation.bannedWords.title": "Banned Words:",
  "guide.moderation.bannedWords.step1": "Go to Dashboard → Moderation",
  "guide.moderation.bannedWords.step2": "Select group to moderate",
  "guide.moderation.bannedWords.step3": "Add forbidden words in 'Banned Words'",
  "guide.moderation.bannedWords.step4": "Choose action: Delete, Delete+Kick, or Delete+Ban",
  "guide.moderation.bannedWords.step5": "Toggle on 'Auto Delete'",
  "guide.moderation.autoKickBan.title": "Auto Kick/Ban:",
  "guide.moderation.autoKickBan.step1": "In Moderation page, set threshold (e.g., 3 violations)",
  "guide.moderation.autoKickBan.step2": "Toggle on 'Auto Kick' to remove user after threshold",
  "guide.moderation.autoKickBan.step3": "Toggle on 'Auto Ban' to block user from rejoining",
  "guide.moderation.autoKickBan.step4": "All actions will be logged in 'Moderation Logs'",

  "guide.affiliates.title": "Affiliate System",
  "guide.affiliates.setup.title": "Setup:",
  "guide.affiliates.setup.step1": "Go to Dashboard → Affiliate Settings",
  "guide.affiliates.setup.step2": "Set commission rate (e.g., 10%)",
  "guide.affiliates.setup.step3": "Set minimum payout amount",
  "guide.affiliates.setup.step4": "Enable affiliate system",
  "guide.affiliates.usage.title": "Usage:",
  "guide.affiliates.usage.step1": "Each user gets a unique referral link",
  "guide.affiliates.usage.step2": "Share link to friends",
  "guide.affiliates.usage.step3": "When friends signup using link, you earn commission",
  "guide.affiliates.usage.step4": "Track earnings in Dashboard → Affiliates",

  "guide.analytics.title": "Analytics & Reports",
  "guide.analytics.step1": "Go to Dashboard → Analytics",
  "guide.analytics.step2": "View metrics: Total Users, Active Groups, Messages Sent",
  "guide.analytics.step3": "Filter by date range to compare performance",
  "guide.analytics.step4": "Export reports in CSV format",

  "guide.tips.title": "Tips & Best Practices",
  "guide.tips.tip1": "Ensure bot has admin rights in groups for auto-moderation to work",
  "guide.tips.tip2": "Test auto-reply rules in private chat before activating for all",
  "guide.tips.tip3": "Use segments to target broadcasts to the right audience",
  "guide.tips.tip4": "Check logs regularly to monitor bot activity and debug issues",
  "guide.tips.tip5": "Backup your banned words list and auto-reply rules periodically",
};

const translations: Record<Locale, Record<string, string>> = {
  en: baseEnglishTranslations,
  ms: {
    "lang.label": "Bahasa",
    "lang.en": "Inggeris",
    "lang.ms": "Bahasa Malaysia",
    "lang.zh": "Cina",
    "lang.th": "Thai",
    "lang.my": "Myanmar",
    "lang.ko": "Korea",
    "lang.ja": "Jepun",
    "lang.hi": "Hindi",
    "lang.ta": "Tamil",
    "lang.ar": "Arab",
    "lang.ru": "Rusia",
    "lang.it": "Itali",

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
    "sidebar.item.howToUse": "Panduan",

    "guide.title": "Panduan Guna Bot",
    "guide.subtitle": "Tutorial lengkap setup dan guna semua features bot Telegram",
    "guide.gettingStarted.title": "Bermula",
    "guide.gettingStarted.botToken.title": "Dapatkan Bot Token",
    "guide.gettingStarted.botToken.step1": "Buka Telegram dan cari @BotFather",
    "guide.gettingStarted.botToken.step2": "Hantar command /newbot",
    "guide.gettingStarted.botToken.step3": "Ikut arahan untuk namakan bot anda",
    "guide.gettingStarted.botToken.step4": "Copy token yang diberikan (format: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)",
    "guide.gettingStarted.botToken.step5": "Pergi ke Dashboard → Settings dan paste token dalam 'Bot Token'",
    "guide.gettingStarted.webhook.title": "Setup Webhook",
    "guide.gettingStarted.webhook.step1": "Selepas masukkan token, klik 'Set Webhook'",
    "guide.gettingStarted.webhook.step2": "Tunggu sehingga status webhook bertukar 'Active'",
    "guide.gettingStarted.webhook.step3": "Bot anda kini boleh terima mesej!",

    "guide.addingBot.title": "Tambah Bot ke Group/Channel",
    "guide.addingBot.groups.title": "Untuk Group:",
    "guide.addingBot.groups.step1": "Buka group Telegram anda",
    "guide.addingBot.groups.step2": "Tap pada nama group → 'Edit' → 'Administrators'",
    "guide.addingBot.groups.step3": "Tap 'Add Admin' dan cari nama bot anda",
    "guide.addingBot.groups.step4": "Berikan permissions: Delete Messages, Ban Users, Invite Users",
    "guide.addingBot.groups.step5": "Bot akan muncul di Dashboard → Groups",
    "guide.addingBot.channels.title": "Untuk Channel:",
    "guide.addingBot.channels.step1": "Buka channel Telegram anda",
    "guide.addingBot.channels.step2": "Tap nama channel → 'Administrators'",
    "guide.addingBot.channels.step3": "Tap 'Add Administrator' dan pilih bot anda",
    "guide.addingBot.channels.step4": "Berikan permission 'Post Messages'",
    "guide.addingBot.channels.step5": "Bot akan muncul di Dashboard → Channels",

    "guide.broadcast.title": "Hantar Broadcast",
    "guide.broadcast.step1": "Pergi ke Dashboard → Broadcast",
    "guide.broadcast.step2": "Pilih jenis target: Private (users), Groups, atau Channels",
    "guide.broadcast.step3": "Tulis mesej anda (boleh guna formatting: *bold*, _italic_)",
    "guide.broadcast.step4": "Opsional: Attach image atau document",
    "guide.broadcast.step5": "Pilih 'Send Now' atau schedule untuk hantar kemudian",
    "guide.broadcast.step6": "Monitor status hantar dalam tab 'History'",

    "guide.autoReply.title": "Setup Auto-Reply",
    "guide.autoReply.step1": "Pergi ke Dashboard → Auto Reply",
    "guide.autoReply.step2": "Klik 'Add Rule'",
    "guide.autoReply.step3": "Tentukan trigger keyword (contoh: 'harga', 'info', '/start')",
    "guide.autoReply.step4": "Pilih match type: Exact, Contains, atau Starts With",
    "guide.autoReply.step5": "Tulis reply message",
    "guide.autoReply.step6": "Pilih scope: All users, Specific groups, atau Private chats sahaja",
    "guide.autoReply.step7": "Save dan activate rule",

    "guide.moderation.title": "Moderation & Security",
    "guide.moderation.bannedWords.title": "Banned Words:",
    "guide.moderation.bannedWords.step1": "Pergi Dashboard → Moderation",
    "guide.moderation.bannedWords.step2": "Pilih group yang nak di-moderate",
    "guide.moderation.bannedWords.step3": "Tambah perkataan terlarang dalam 'Banned Words'",
    "guide.moderation.bannedWords.step4": "Pilih action: Delete, Delete+Kick, atau Delete+Ban",
    "guide.moderation.bannedWords.step5": "On-kan toggle 'Auto Delete'",
    "guide.moderation.autoKickBan.title": "Auto Kick/Ban:",
    "guide.moderation.autoKickBan.step1": "Di page Moderation, set threshold (contoh: 3 violations)",
    "guide.moderation.autoKickBan.step2": "On-kan 'Auto Kick' untuk keluarkan user selepas threshold",
    "guide.moderation.autoKickBan.step3": "On-kan 'Auto Ban' untuk block user join semula",
    "guide.moderation.autoKickBan.step4": "Semua tindakan akan log dalam 'Moderation Logs'",

    "guide.affiliates.title": "Affiliate System",
    "guide.affiliates.setup.title": "Setup:",
    "guide.affiliates.setup.step1": "Pergi Dashboard → Affiliate Settings",
    "guide.affiliates.setup.step2": "Set commission rate (contoh: 10%)",
    "guide.affiliates.setup.step3": "Set minimum payout amount",
    "guide.affiliates.setup.step4": "On-kan affiliate system",
    "guide.affiliates.usage.title": "Guna:",
    "guide.affiliates.usage.step1": "Setiap user dapat referral link unique",
    "guide.affiliates.usage.step2": "Share link kepada rakan",
    "guide.affiliates.usage.step3": "Bila rakan signup guna link tu, anda dapat commission",
    "guide.affiliates.usage.step4": "Track earnings di Dashboard → Affiliates",

    "guide.analytics.title": "Analytics & Reports",
    "guide.analytics.step1": "Pergi Dashboard → Analytics",
    "guide.analytics.step2": "Lihat metrics: Total Users, Active Groups, Messages Sent",
    "guide.analytics.step3": "Filter by date range untuk compare performance",
    "guide.analytics.step4": "Export reports dalam format CSV",

    "guide.tips.title": "Tips & Best Practices",
    "guide.tips.tip1": "Pastikan bot mempunyai admin rights dalam group untuk auto-moderation berfungsi",
    "guide.tips.tip2": "Test auto-reply rules dalam private chat dulu sebelum activate untuk semua",
    "guide.tips.tip3": "Gunakan segments untuk target broadcast kepada audience yang betul",
    "guide.tips.tip4": "Check logs regularly untuk monitor bot activity dan debug issues",
    "guide.tips.tip5": "Backup banned words list dan auto-reply rules secara berkala",
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