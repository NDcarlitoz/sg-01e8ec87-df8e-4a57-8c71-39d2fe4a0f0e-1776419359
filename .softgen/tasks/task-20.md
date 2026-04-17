---
title: Minta nombor telefon masa welcome chat
status: in_progress
priority: high
type: feature
tags: [telegram, bot, leads, backend, frontend]
created_by: agent
created_at: 2026-04-17T07:10:00Z
position: 20
---

## Notes
Feature: Bila user mula chat dengan bot (contoh `/start` dalam private chat), bot akan:
- Hantar mesej welcome
- Minta user share nombor telefon dengan satu butang khas Telegram (request_contact)
- Bila user tekan butang dan share contact, sistem simpan nombor telefon ke dalam table yang relevan (leads / users) dan ucap terima kasih.

Perlu:
- Guna `request_contact` keyboard button dalam Telegram API
- Handle update jenis `message.contact` dalam webhook
- Simpan phone ke Supabase (guna servis/struktur sedia ada, contohnya `leadService`)

## Checklist
- [ ] Semak schema Supabase untuk table yang simpan phone (contoh: `leads` / `profiles` – nama kolum sebenar)
- [ ] Semak `telegramService` dan webhook handler untuk pattern hantar mesej & keyboard options
- [ ] Tambah logic di webhook:
  - [ ] Bila `/start` dalam private chat → hantar welcome + butang "Share phone number" (request_contact)
  - [ ] Bila terima `message.contact` → call service untuk simpan nombor telefon user (upsert)
  - [ ] Hantar mesej "terima kasih, nombor telah direkod"
- [ ] Guna `leadService` atau servis sedia ada untuk simpan phone (jangan duplicate logic)
- [ ] Pastikan behaviour di group tak terganggu (feature ini fokus untuk private chat)
- [ ] Run check_for_errors dan pastikan semua build ok