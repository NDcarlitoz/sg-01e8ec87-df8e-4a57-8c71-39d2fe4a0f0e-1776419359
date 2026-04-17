---
title: Create "How to Use Bot" tutorial/guide page
status: done
priority: high
type: feature
tags: [documentation, frontend, tutorial, dashboard]
created_by: agent
created_at: 2026-04-16T23:15:00Z
position: 19
---

## Notes
Buat satu page tutorial yang comprehensive untuk guide user setup dan guna bot dari awal sampai habis. Page ni perlu:
- Step-by-step setup guide (bot token, webhook, add to groups)
- Tutorial untuk setiap feature utama (broadcast, auto-reply, moderation, affiliates, etc.)
- Visual friendly dengan accordion/tabs untuk mudah navigate
- Support BM + EN (minimum)
- Screenshots placeholder atau visual guides

Target: user baru boleh faham dan setup sendiri tanpa perlu technical knowledge.

## Checklist
- [x] Create `/dashboard/how-to-use` page dengan DashboardLayout
- [x] Add sidebar menu item untuk "How to Use" / "Panduan"
- [x] Structure content dengan sections:
  - [x] Getting Started (bot token setup, webhook)
  - [x] Adding Bot to Groups/Channels
  - [x] Broadcast Messages
  - [x] Auto-Reply Setup
  - [x] Moderation & Security
  - [x] Affiliate System
  - [x] Analytics & Reports
- [x] Use Accordion UI untuk setiap section
- [x] Add i18n keys untuk semua text (BM + EN)
- [x] Add visual elements (icons, badges, alerts untuk important notes)
- [x] Test navigation dan ensure readable untuk non-technical users