---
title: Set up i18n framework with BM and English for dashboard
status: in_progress
priority: high
type: feature
tags: [frontend, i18n, dashboard]
created_by: agent
created_at: 2026-04-16T22:00:00Z
position: 17
---

## Notes
Introduce a simple i18n framework for the dashboard so that all navigation labels and UI texts can support both Bahasa Malaysia and English. Start with BM and English only, but structure the code so that more languages can be added later. Add a language switcher so users can change between BM and English easily.

## Checklist
- [x] Create a lightweight i18n context/provider with:
  - [x] Type-safe locale enum (e.g. "en", "ms")
  - [x] Translation dictionaries for BM and English
  - [x] `t(key)` helper with sensible fallbacks
  - [x] Local persistence of chosen locale (e.g. localStorage)
- [x] Wrap the app in the new i18n provider in `_app.tsx`
- [ ] Integrate i18n into `DashboardLayout`:
  - [ ] Replace hardcoded sidebar labels with `t("...")`
  - [ ] Add a minimal language switcher in the dashboard header for BM/English
- [ ] Ensure everything compiles and the dashboard still works as before
- [ ] Document how to add new languages and keys later