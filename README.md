# Jarvis UI

> Desktop interface for the Jarvis AI assistant — built with Electron + React.

A cinematic, Iron Man-inspired desktop app that connects to the [Jarvis API](https://github.com/Luissoares11/jarvis) and gives it a full visual interface. Dark terminal aesthetic, live data panels, and a mini overlay mode for quick access from anywhere on the desktop.

---

## Features

**Chat** — Full conversation interface with the Jarvis AI. Supports all natural language commands — memory, computation, weather, football, todos, reminders, calendar events, and more.

**Live panels** — Sidebar panels showing real-time data: current weather, active tasks, pending reminders, and upcoming events. Auto-refreshes every 30 seconds.

**Tasks & Reminders** — Dedicated page to manage your to-do list and set reminders with a clean UI, without typing commands.

**Calendar** — View, add, and delete events. Toggle between upcoming and past events.

**Memory** — Browse everything Jarvis knows — facts about you, people you've mentioned, relationships — grouped by entity and deletable in one click.

**Settings** — Configure server URL, API token, and hotkey. Persisted locally across sessions.

**Mini mode** — Press `Ctrl+Space` anywhere on the desktop to bring up a small floating input bar. Type a command, get a response, press `Escape` to dismiss. No need to open the full app.

**System tray** — Closing the window minimizes to tray. Right-click for options, left-click to reopen.

**Interactive plots** — Mathematical graphs rendered with Plotly — zoomable, pannable, hoverable.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Electron + React + Vite |
| Styling | Pure CSS — terminal aesthetic |
| HTTP | Axios |
| Plots | Plotly (via Jarvis API) |
| Config | dotenv + persistent JSON via Electron IPC |
| Packaging | electron-builder |

---

## Project structure

```
jarvis-ui/
├── src/
│   ├── assets/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── TimerDisplay.jsx
│   │   │   └── Titlebar.jsx
│   │   ├── styles/
│   │   │   ├── app.css
│   │   │   └── titlebar.css
│   │   └── utils/
│   │       ├── api.js
│   │       ├── config.js
│   │       └── launcher.js
│   │
│   ├── windows/
│   │   ├── calendar/
│   │   │   ├── Calendar.jsx
│   │   │   └── calendar.css
│   │   │
│   │   ├── card/
│   │   │   ├── Card.jsx
│   │   │   └── card.css
│   │   │
│   │   ├── chat/
│   │   │   ├── Chat.jsx
│   │   │   └── chat.css
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── dashboard.css
│   │   │
│   │   ├── memory/
│   │   │   ├── Memory.jsx
│   │   │   └── memory.css
│   │   │
│   │   ├── mini/
│   │   │   ├── Mini.jsx
│   │   │   └── mini.css
│   │   │
│   │   ├── settings/
│   │   │   ├── Settings.jsx
│   │   │   └── settings.css
│   │   │
│   │   └── tasks/
│   │       ├── Tasks.jsx
│   │       └── tasks.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── electron.cjs
├── .env
├── package.json
```

---

## Setup

Requires the [Jarvis API](https://github.com/Luissoares11/jarvis) running and accessible.

```bash
git clone https://github.com/Luissoares11/jarvis-ui.git
cd jarvis-ui
npm install
```

Create a `.env` file:
```
VITE_API_URL=http://your-server-ip:8000
VITE_TOKEN=your_jarvis_token
```

Run in development:
```bash
npm run start
```

Build as a desktop app:
```bash
npm run build
npx electron-builder
```

---

## Hotkeys

| Hotkey | Action |
|---|---|
| `Ctrl+Shift+J` | Toggle mini mode overlay |
| `Enter` | Send message |
| `Escape` | Dismiss mini mode |

---

## Roadmap

- [x] Chat interface
- [x] Live data panels
- [x] Tasks & reminders page
- [x] Calendar page
- [x] Memory browser
- [x] Settings with persistence
- [x] Mini mode overlay
- [x] System tray
- [x] Interactive plots
- [x] JSON API endpoints
- [x] Integration tests + CI pipeline
- [X] Event title/type DB schema split
- [ ] Architecture refactor — launcher-centric UI
- [ ] Phone UI — React Native (Stage 10)
- [ ] Voice & device control (Stage 11)
- [ ] Docker — containerized deployment (Stage 12)
- [ ] Home automation (Stage 13)

---

*Built by Luís Soares — part of the Jarvis project*
