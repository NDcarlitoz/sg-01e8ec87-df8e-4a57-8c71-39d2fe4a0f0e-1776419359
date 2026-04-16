---
title: Enhance bot security moderation (auto kick/ban/banned words)
status: in_progress
priority: high
type: feature
tags: [moderation, security, telegram, backend, frontend]
created_by: agent
created_at: 2026-04-16T22:48:49Z
position: 18
---

## Notes
Tambah sistem security untuk bot Telegram supaya:
- Boleh detect banned words dalam mesej
- Auto delete mesej yang mengandungi banned words
- Auto kick user daripada group bila langgar peraturan (ikut threshold)
- Auto ban user (block dari join semula) kalau repeated offense

Perlu integrate dengan:
- Telegram webhook `/api/telegram/webhook`
- `telegramService` untuk tindakan (deleteMessage, kick, ban)
- `moderationService` + database tables untuk simpan rules & log
- UI moderation dashboard supaya admin boleh set:
  - Senarai banned words
  - Toggles: auto delete, auto kick, auto ban
  - Threshold sebelum kick/ban (contoh: 1st offense warn, 2nd delete, 3rd kick/ban)

Semua log tindakan security perlu direkod (siapa, group mana, sebab apa).

## Checklist
- [x] Semak struktur sedia ada: `moderationService`, `telegramService`, `groupService`, dan `/api/telegram/webhook`
- [ ] Pastikan database ada jadual untuk moderation rules & logs; tambah kolum/tabla jika perlu (guna Supabase)
- [x] Tambah atau extend servis moderation supaya:
  - [x] Boleh simpan dan baca senarai banned words per bot/group
  - [x] Simpan setting: autoDelete, autoKick, autoBan, dan thresholds
  - [x] Simpan log offense per user (kira berapa kali dia langgar)
- [ ] Update Telegram webhook handler supaya:
  - [x] Setiap mesej masuk akan di-scan banned words dan rules
  - [x] Bila detect:
    - [x] Auto delete mesej jika autoDelete aktif
    - [x] Kira offense count dan jika lepas threshold, guna telegramService untuk:
      - [x] Kick user dari group (auto kick)
      - [x] Ban user (block join) jika autoBan aktif
    - [x] Rekod log tindakan ke database
- [ ] Update UI page `dashboard/moderation`:
  - [x] Section untuk manage banned words (list, add, remove)
  - [x] Toggles untuk auto delete / auto kick / auto ban
  - [x] Input threshold (contoh: berapa kali offense sebelum kick/ban)
- [ ] Pastikan semua teks baharu guna sistem i18n (sekurang‑kurangnya English + BM)
- [ ] Run check for errors (lint + typecheck) dan pastikan dashboard & webhook build tanpa error