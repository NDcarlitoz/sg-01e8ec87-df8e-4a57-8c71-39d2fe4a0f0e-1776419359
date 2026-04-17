---
title: Minta nombor telefon masa welcome chat
status: done
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
- Bila user tekan butang dan share contact, sistem simpan nombor telefon ke dalam table yang relevan dan ucap terima kasih.

Implementasi:
- Guna `request_contact` keyboard button dalam Telegram API
- Handle update jenis `message.contact` dalam webhook
- Simpan phone ke Supabase dalam kolum `bot_users.phone_number` (boleh guna di Users dashboard)
- Behaviour di group tidak berubah; fungsi ini fokus untuk private chat (/start) walaupun contact share juga akan disimpan jika dihantar dari tempat lain.

## Checklist
- [x] Semak schema Supabase untuk table yang simpan phone (contoh: `leads` / `profiles` – nama kolum sebenar)
- [x] Semak `telegramService` dan webhook handler untuk pattern hantar mesej & keyboard options
- [x] Tambah logic di webhook:
  - [x] Bila `/start` dalam private chat → hantar welcome + butang "Share phone number" (request_contact)
  - [x] Bila terima `message.contact` → simpan nombor telefon user ke `bot_users.phone_number` (upsert)
  - [x] Hantar mesej "terima kasih, nombor telah direkod"
- [x] Guna struktur sedia ada (`bot_users`) untuk simpan phone (tanpa duplicate logic leads)
- [x] Pastikan behaviour di group tak terganggu (feature ini fokus untuk private chat)
- [x] Run check_for_errors dan pastikan semua build ok