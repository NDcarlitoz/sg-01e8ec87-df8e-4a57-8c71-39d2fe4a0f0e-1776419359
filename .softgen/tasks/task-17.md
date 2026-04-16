---
title: Set up i18n framework with BM and English for dashboard
status: done
priority: high
type: feature
tags: [frontend, i18n, dashboard]
created_by: agent
created_at: 2026-04-16T22:00:00Z
position: 17
---

## Notes
Introduce a simple i18n framework for the dashboard so that all navigation labels and UI texts can support both Bahasa Malaysia and English. Start with BM and English only, but structure the code so that more languages can be added later. Add a language switcher so users can change between BM and English easily.

To add a new language later:
- Tambah code baru dalam `Locale` union di `src/contexts/I18nContext.tsx` (contoh `"th"` untuk Thai).
- Tambah entry baru dalam `translations` object dengan semua key yang sama (boleh copy dari English dulu, kemudian translate).
- Jika mahu expose dalam UI, tambah option baru dalam language switcher (header dashboard) dengan panggilan `setLocale("<kode_bahasa>")`.

## Checklist
- [x] Create a lightweight i18n context/provider with:
  - [x] Type-safe locale enum (e.g. "en", "ms")
  - [x] Translation dictionaries for BM and English
  - [x] `t(key)` helper with sensible fallbacks
  - [x] Local persistence of chosen locale (e.g. localStorage)
- [x] Wrap the app in the new i18n provider in `_app.tsx`
- [x] Integrate i18n into `DashboardLayout`:
  - [x] Replace hardcoded sidebar labels with `t("...")`
  - [x] Add a minimal language switcher in the dashboard header for BM/English
- [x] Ensure everything compiles and the dashboard still works as before
- [x] Document how to add new languages and keys later