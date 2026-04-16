---
title: Create Logs Viewer Page
status: done
priority: medium
type: feature
tags: [frontend, monitoring]
created_by: agent
created_at: 2026-04-16T12:30:00Z
position: 13
---

## Notes
Create a comprehensive logs viewer page to monitor all incoming Telegram commands and bot responses. Display user interactions with filtering, search, and real-time updates.

## Checklist
- [x] Create logsService.ts for fetching interaction logs from database
- [x] Create logs.tsx page with table view of all interactions
- [x] Add filtering by interaction type (message, command, callback)
- [x] Add search by user name or content
- [x] Add date range filtering
- [x] Display user info, command, timestamp, metadata
- [x] Add export functionality (CSV)
- [x] Add refresh button for real-time monitoring