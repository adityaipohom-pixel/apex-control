# APEX CONTROL

A tablet-first web dashboard that monitors and controls the **APEX** Windows PC over the local Wi-Fi network. It is built to feel like a dedicated physical Stream Deck / command centre, but runs entirely in a browser.

> Dark glassmorphism UI · React + TypeScript + Vite + Tailwind CSS · Lucide icons · no backend required to run (built-in simulated PC)

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173  (also exposed on your LAN IP)
```

Open the printed **Network** URL on the tablet connected to the same Wi-Fi:

```
➜  Network: http://192.168.x.x:5173/
```

Production build:

```bash
npm run build        # outputs dist/
npm run preview      # serve the build locally
```

### Use it like an app on the tablet

The build ships a web manifest + icons, so on Android you can open the LAN URL
in Chrome → **⋮ → Add to Home screen**. It then launches fullscreen with no
browser chrome, exactly like a dedicated control panel. `Settings → Fullscreen
mode` also requests fullscreen from within the app.

Regenerate the app icons (no dependencies) with:

```bash
python3 scripts/generate_icons.py
```

---

## Demo mode vs. a real PC

Out of the box the dashboard runs in **demo mode**: `src/services/mockServer.ts`
answers the exact same routes with realistic, slowly-changing telemetry, so the
whole UI (navigation, media transport, volume, confirmations, offline handling)
is fully functional before the PC server exists.

To talk to the real PC, either:

1. Create `.env.local`:

   ```env
   VITE_API_URL=http://192.168.1.8:8080
   VITE_DEMO_MODE=false
   ```

2. Or use **Settings → PC connection** in the UI (stored in `localStorage`).

A minimal reference Flask implementation lives in [`server/`](server/README.md) —
it is optional and only needed if you want the PC side running quickly.

---

## Pages

| Route | What it does |
| --- | --- |
| `/` | Home dashboard: hero, Quick Apps, System Monitor, System Actions, Volume, Live Info, Media Control, Recent Apps |
| `/apps` | Full app library, pin/reorder shortcuts, create custom shortcuts |
| `/media` | Large transport, master volume, player selector, queue |
| `/system` | Full telemetry (history charts, disks, processes) + power actions + maintenance |
| `/files` | Browse the PC's folders remotely (read-only listing) |
| `/tools` | Macros (Morning Setup / Gaming Mode / Focus), clipboard push, notifications, maintenance |
| `/settings` | PC address & port, polling, theme, accent, confirmations, fullscreen, diagnostics |

Navigation is a **rail** on tablets/desktops and a **bottom bar** on phones;
below `lg` the rail becomes a swipe-in drawer.

---

## Architecture

```
src/
├── components/
│   ├── layout/      AppShell, Sidebar, TopBar, BottomNav, PageHeader
│   ├── ui/          Card, Button, IconButton, Modal, UsageRing, Sparkline,
│   │                Badge, Switch, Select, TextField, Progress, Skeleton,
│   │                EmptyState, ConnectionPill, Logo, AppIcon
│   └── dashboard/   HeroBanner, QuickApps, AppCard, SystemMonitor, MediaControl,
│                    SystemActions, VolumeControl, LiveInfo, RecentApps
├── pages/           Home, Apps, Media, System, Files, Tools, Settings, NotFound
├── hooks/           useSettings, useConnection, useSystemStats, useMedia,
│                    useSystemActions, useApps, useToast, useClock, useRouter, useHaptics
├── services/        api.ts (client), endpoints.ts (route registry),
│                    connection.ts (polling service), mockServer.ts (simulated PC)
├── types/           api.ts – the frontend ⇄ backend contract
└── utils/           format.ts, cn.ts
```

**Rules the codebase follows**

- Components never build URLs or call `fetch` — they call `api.*` methods.
- Every reachable route is declared once in `src/services/endpoints.ts`.
- App ids are opaque; **Windows executable paths never exist in the frontend**.
- No endpoint accepts a raw shell command.

---

## API contract

All responses use the envelope `{ "ok": true, "data": … }` / `{ "ok": false, "error": "…" }`.

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| GET | `/api/status` | – | online flag, hostname, IP, OS, uptime, latency, Wi-Fi |
| GET | `/api/system/stats` | – | CPU / RAM / disks / GPU / network telemetry |
| GET | `/api/system/processes` | – | top processes (pid, name, cpu, memory) |
| POST | `/api/apps/launch` | `{ "app": "chrome" }` | launch an app by id |
| POST | `/api/apps/close` | `{ "app": "chrome" }` | close an app by id |
| GET | `/api/apps/recent` | – | recently launched ids |
| POST | `/api/system/lock` | – | lock the workstation |
| POST | `/api/system/sleep` | – | sleep |
| POST | `/api/system/restart` | – | restart |
| POST | `/api/system/shutdown` | – | shutdown |
| POST | `/api/system/display-off` | – | blank the displays |
| POST | `/api/system/wake-on-lan` | – | send a magic packet |
| POST | `/api/system/screenshot` | – | save a screenshot |
| POST | `/api/system/empty-recycle-bin` | – | empty the Recycle Bin |
| GET | `/api/media` | – | now playing (title, artist, position, volume, muted, source) |
| POST | `/api/media/play-pause` | – | toggle playback |
| POST | `/api/media/previous` | – | previous track |
| POST | `/api/media/next` | – | next track |
| POST | `/api/media/volume` | `{ "value": 70 }` | set volume 0-100 |
| POST | `/api/media/mute` | `{ "muted": true }` | mute/unmute (omit body to toggle) |
| POST | `/api/media/seek` | `{ "positionSec": 88 }` | scrub |
| POST | `/api/media/source` | `{ "source": "spotify" }` | select active player |
| GET | `/api/media/queue` | – | playlist |
| GET | `/api/files?path=/Users/APEX` | – | folder listing |
| POST | `/api/files/open` | `{ "path": "…" }` | open a file/folder on the PC |
| POST | `/api/files/download` | `{ "path": "…" }` | queue a download |
| POST | `/api/tools/clipboard` | `{ "text": "…" }` | push text to the PC clipboard |
| POST | `/api/tools/notify` | `{ "title": "…", "message": "…" }` | show a PC notification |

CORS must be enabled on the Flask server (the reference server does this) when the
dashboard is served from a different origin.

---

## Configuration

### Environment (`.env.local`, see `.env.example`)

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_URL` | – | Base URL of the Flask server, e.g. `http://192.168.1.8:8080` |
| `VITE_DEMO_MODE` | auto | `true` forces the simulated PC, `false` forces the network |
| `VITE_STATUS_POLL_MS` | 5000 | status poll interval |
| `VITE_STATS_POLL_MS` | 2000 | telemetry poll interval |
| `VITE_MEDIA_POLL_MS` | 1000 | media poll interval |
| `VITE_API_TIMEOUT_MS` | 8000 | per-request timeout |
| `APEX_API_TARGET` | `http://127.0.0.1:8080` | dev-server proxy target for `/api` |

### In-app settings (persisted in `localStorage`)

PC address · port · demo mode · auto reconnect · dashboard name · theme
(Obsidian / Deep Navy / Graphite / Midnight) · accent colour (6 options) ·
collapsed rail · reduce motion · haptics · confirm before shutdown/restart ·
fullscreen · poll intervals.

---

## Tablet UX

- **Landscape first**: the home dashboard is a 12-column grid that collapses to a
  single stacked column in portrait.
- **Touch targets**: every control is at least 44 × 44 px (most are 48-56 px).
- **No hover-only behaviour**: hover adds affordance, taps always work.
- **Press feedback**: scale-down on press plus optional haptic vibration.
- **Safe areas** respected for tablets with rounded corners/notches.
- **Offline resilience**: the header turns red, a retry banner appears, widgets
  show skeletons/stale badges and nothing crashes.

---

## Security model

- The browser can only call the fixed, intent-scoped endpoints above.
- There is **no** `/api/execute?command=…` style endpoint anywhere.
- Power actions require confirmation (configurable).
- Preferences live in `localStorage` only; nothing is sent anywhere except the
  configured PC address.

---

## Scripts

```bash
npm run dev         # dev server (LAN accessible)
npm run build       # type-check + production build
npm run preview     # preview the production build
npm run typecheck   # tsc only
```
