---
title: Persist theme preference in database
status: done
priority: medium
type: feature
tags: [frontend, supabase, theme]
created_by: agent
created_at: 2026-04-16T21:39:32Z
position: 15
---

## Notes
Make the light/dark theme toggle remember the user's preference across sessions by saving it in the Supabase `profiles` table. When a logged-in user switches theme, update their profile. On app load, use the saved preference as the initial theme for that user, with sensible fallbacks when no preference is stored.

## Checklist
- [x] Add a `theme_preference` column to the `profiles` table (allowed values: "light", "dark")
- [x] Extend `profileService` types and methods to include `theme_preference`
- [x] Update `ThemeProvider` to:
  - [x] Read the logged-in user's `theme_preference` on mount
  - [x] Use it as the initial theme when present, falling back to system/default when absent
  - [x] Keep local UI state in sync with context
- [x] Update `ThemeSwitch` so that toggling theme:
  - [x] Updates the Theme context
  - [x] Persists the new value via `profileService.updateProfile`
  - [x] Works gracefully when no user is logged in (no DB write, still toggles UI)
- [x] Ensure no auth lock or race-condition issues (use AuthContext instead of direct Supabase calls)
- [x] Manually verify: switch theme, refresh page, and confirm the chosen theme persists for that user