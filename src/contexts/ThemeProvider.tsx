"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

function ThemeSync() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const lastSavedThemeRef = useRef<string | null>(null);
  const hasLoadedFromProfileRef = useRef(false);

  useEffect(() => {
    if (!user) {
      // No authenticated user; do not load or persist to DB
      return;
    }

    let isCancelled = false;

    const loadThemePreference = async () => {
      const { data } = await profileService.getProfileById(user.id);

      if (isCancelled || !data) {
        return;
      }

      if (data.theme_preference === "light" || data.theme_preference === "dark") {
        lastSavedThemeRef.current = data.theme_preference;
        if (theme !== data.theme_preference) {
          setTheme(data.theme_preference);
        }
      }

      hasLoadedFromProfileRef.current = true;
    };

    loadThemePreference();

    return () => {
      isCancelled = true;
    };
    // We intentionally depend on user and theme so that if user changes or theme changes before load finishes, we stay consistent.
  }, [user, theme, setTheme]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!hasLoadedFromProfileRef.current) {
      // Avoid writing before we've loaded the initial preference
      return;
    }

    if (theme !== "light" && theme !== "dark") {
      // Only persist explicit light/dark choices, ignore "system"
      return;
    }

    if (lastSavedThemeRef.current === theme) {
      return;
    }

    lastSavedThemeRef.current = theme;

    const persistThemePreference = async () => {
      await profileService.updateProfile({
        theme_preference: theme,
      });
    };

    void persistThemePreference();
  }, [theme, user]);

  return null;
}