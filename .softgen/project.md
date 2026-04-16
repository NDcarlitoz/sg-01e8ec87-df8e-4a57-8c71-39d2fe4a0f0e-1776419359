# Telegram Automation Bot Admin Dashboard

## Vision
Platform admin untuk manage Telegram automation bot dengan features lengkap - bot configuration, group management, broadcast system, affiliate tracking, leads management, dan analytics. Built untuk admin yang mahukan full control tanpa perlu coding.

## Design
Color palette (HSL format):
- `--primary: 214 95% 51%` (bright blue - professional, clean)
- `--accent: 214 95% 51%` (blue - interactive elements)
- `--success: 142 76% 36%` (green - positive actions)
- `--warning: 38 92% 50%` (amber - alerts)
- `--background: 0 0% 100%` (clean white)
- `--foreground: 210 24% 16%` (dark blue-grey text)
- `--muted: 210 40% 96%` (light grey backgrounds)
- `--border: 214 32% 91%` (subtle grey borders)
- `--secondary: 214 32% 91%` (light grey surfaces)

Typography:
- Headings: Plus Jakarta Sans (600, 700)
- Body: Work Sans (400, 500, 600)

Style direction: Modern admin dashboard dengan blue & grey professional theme - clean, functional, data-dense tapi organized dengan clear visual hierarchy.

## Features
- **Bot Settings**: Configure welcome messages, menu buttons, auto-replies
- **Group Management**: Monitor groups/channels, manage members, auto-moderation
- **Broadcast System**: Send targeted messages dengan scheduling ke private/groups/channels
- **Affiliate System**: Track referrals, manage commissions, generate referral links
- **Leads Management**: Capture user data, segmentation, export functionality
- **Analytics**: Real-time stats, growth charts, engagement metrics, custom reports
]]></create_file>
  <full_file_rewrite file_path="src/styles/globals.css"><![CDATA[@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Work+Sans:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 214 95% 51%;
    --primary-foreground: 210 40% 98%;
    --secondary: 214 32% 91%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 214 95% 51%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 69% 33%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Work Sans', system-ui, sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
}