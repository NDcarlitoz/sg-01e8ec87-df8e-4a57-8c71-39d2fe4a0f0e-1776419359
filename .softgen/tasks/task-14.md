---
title: Build Welcome Message Editor with Variables
status: done
priority: high
type: feature
tags: [frontend, bot-settings, editor]
created_by: agent
created_at: 2026-04-16T12:40:00Z
position: 14
---

## Notes
Create a rich editor for customizing the bot's welcome message with support for dynamic variables like {name}, {username}, {first_name}. Include live preview and variable insertion buttons.

## Checklist
- [x] Add welcome_message column to bot_tokens table
- [x] Create WelcomeMessageEditor component with textarea
- [x] Add variable insertion buttons ({name}, {username}, {first_name}, {last_name})
- [x] Create live preview panel showing how message will look
- [x] Add save functionality to update bot settings
- [x] Update webhook handler to use custom welcome message
- [x] Replace variables with actual user data when sending
- [x] Add default welcome message template