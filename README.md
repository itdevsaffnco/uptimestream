# StatusServer — SAFF & Co.

Real-time uptime monitoring dashboard for SAFF & Co. services, powered by [UptimeRobot](https://uptimerobot.com).

## Features

- **Live monitor status** — Pulls all monitors from UptimeRobot API, showing up/down/degraded state with animated status dots
- **Response time chart** — 24h response time history graph per monitor
- **Incident history** — Log of downtime events with start time, end time, and duration
- **Alert contacts** — Displays configured notification channels (email, webhook) from UptimeRobot
- **Recent alerts** — Up/down event log across all monitors
- **Dark mode** — Toggleable via Settings, persisted to localStorage, no flash on reload
- **PWA** — Installable as a standalone app on desktop and mobile
- **Monospace UI** — JetBrains Mono font throughout

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | [TanStack Start](https://tanstack.com/start) v1 (SSR, file-based routing) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 + shadcn/ui components |
| Charts | [Recharts](https://recharts.org) |
| Font | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |
| Data | [UptimeRobot API v2](https://uptimerobot.com/api/) |
| Runtime | Bun / Node.js |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) or Node.js 18+
- A [UptimeRobot](https://uptimerobot.com) account with monitors set up

### Setup

```bash
# Install dependencies
bun install

# Create env file
cp .env.example .env
# Then edit .env and set your UptimeRobot API key

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `UPTIMEROBOT_API_KEY` | UptimeRobot Main API Key (found in My Settings → API Settings) |

> **Note:** Never commit `.env` to version control. The file is already in `.gitignore`.

## Project Structure

```
src/
├── components/
│   ├── AppShell.tsx        # Navigation header + layout wrapper
│   └── ui/                 # shadcn/ui component library
├── hooks/
│   └── use-dark-mode.ts    # Dark mode toggle + localStorage persistence
├── lib/
│   ├── uptime-robot.server.ts  # UptimeRobot API client + server functions
│   └── dummy-data.ts           # Shared TypeScript types
├── routes/
│   ├── __root.tsx          # HTML shell, OG tags, PWA meta, font links
│   ├── index.tsx           # Dashboard — monitor list + stats
│   ├── servers.$serverId.tsx   # Monitor detail — chart + incidents
│   ├── alerts.tsx          # Alert contacts + recent events
│   └── settings.tsx        # Appearance & notification preferences
└── styles.css              # Tailwind theme + dark mode colors
public/
├── manifest.json           # PWA manifest
├── logo.png                # SAFF & Co. logo (light)
└── logo-white.png          # SAFF & Co. logo (dark)
```

## UptimeRobot API

All data is fetched server-side via `createServerFn` (runs only on the server — API key never reaches the browser).

| Function | Endpoint | Used on |
|----------|----------|---------|
| `fetchMonitors()` | `getMonitors` | Dashboard |
| `fetchMonitorDetail(id)` | `getMonitors` + response_times + logs | Monitor detail |
| `fetchAlertContacts()` | `getAlertContacts` | Alerts page |
| `fetchRecentAlerts()` | `getMonitors` + logs | Alerts page |

## Build & Deploy

```bash
# Production build
bun run build

# Preview production build
bun run preview
```

## License

Internal tool — SAFF & Co. All rights reserved.
