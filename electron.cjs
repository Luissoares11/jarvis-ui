const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(app.getPath('userData'), 'jarvis-config.json')

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    }
  } catch {}
  return {
    apiUrl: process.env.VITE_API_URL || '',
    token: process.env.VITE_TOKEN || '',
    hotkey: 'CommandOrControl+Space',
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

ipcMain.handle('get-config', () => loadConfig())
ipcMain.handle('save-config', (event, config) => {
  saveConfig(config)
  registerHotkey(config.hotkey || 'CommandOrControl+Space')
  return true
})

// ─── Window Registry ──────────────────────────────────────────────────────────
// To add a new feature window, add one entry here. Nothing else needs to change.

const WINDOW_CONFIG = {
  calendar:  { hash: 'calendar', width: 900, height: 700 },
  tasks:     { hash: 'tasks',    width: 900, height: 700 },
  settings:     { hash: 'settings', width: 900, height: 700 },
  notes:     { hash: 'notes',    width: 900, height: 700 },
  // dashboard is handled by showing mainWindow — no entry needed
}

// Holds all lazily-created feature + board windows
const featureWindows = {}

// ─── Window Factories ─────────────────────────────────────────────────────────

function loadHash(win, hash) {
  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    win.loadFile(path.join(__dirname, 'dist/index.html'), { hash })
  } else {
    win.loadURL(`http://localhost:5173/#${hash}`)
  }
}

function createStandardWindow(hash, { width = 900, height = 700 } = {}) {
  const win = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: false,
    backgroundColor: '#030710',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  loadHash(win, hash)

  // Hide instead of close so the window is reusable
  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })

  return win
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
    mainWindow.once('ready-to-show', () => mainWindow.show())
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide()
  })
}

function createMiniWindow() {
  miniWindow = new BrowserWindow({
    width: 500,
    height: 60,
    minHeight: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  loadHash(miniWindow, 'mini')
  miniWindow.hide()

  miniWindow.on('blur', () => {
    miniWindow.hide()
  })
}

function createCardWindow() {
  cardWindow = new BrowserWindow({
    width: 340,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  loadHash(cardWindow, 'card')
}

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'tray-icon.png')
    : path.join(__dirname, 'src/assets/tray-icon.png')

  tray = new Tray(iconPath)

  const menu = Menu.buildFromTemplate([
    { label: 'Open Jarvis', click: () => { mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit() },
  ])

  tray.setToolTip('Jarvis')
  tray.setContextMenu(menu)
  tray.on('click', () => { mainWindow.show(); mainWindow.focus() })
}

// ─── Feature Window Routing ───────────────────────────────────────────────────

function openFeatureWindow(name) {
  if (name === 'dashboard') {
    mainWindow.show()
    mainWindow.focus()
    return
  }

  const config = WINDOW_CONFIG[name]
  if (!config) {
    console.warn('[Jarvis] Unknown feature window:', name)
    return
  }

  if (!featureWindows[name]) {
    featureWindows[name] = createStandardWindow(config.hash, config)
  }

  featureWindows[name].show()
  featureWindows[name].focus()
}

function openBoardWindow(boardId, boardTitle) {
  const key = `board:${boardId}`

  if (featureWindows[key]) {
    featureWindows[key].show()
    featureWindows[key].focus()
    return
  }

  const hash = `board?id=${encodeURIComponent(boardId)}&title=${encodeURIComponent(boardTitle)}`
  const win = createStandardWindow(hash, { width: 900, height: 700 })

  win.once('ready-to-show', () => win.show())

  // Board windows are fully destroyed on close (not hidden) — each board
  // is a fresh session, so we don't need to keep them alive in the background.
  win.removeAllListeners('close')
  win.on('closed', () => {
    delete featureWindows[key]
  })

  featureWindows[key] = win
}

// ─── Hotkey ───────────────────────────────────────────────────────────────────

function registerHotkey(hotkey) {
  globalShortcut.unregisterAll()
  globalShortcut.register(hotkey, () => {
    if (miniWindow.isVisible()) {
      miniWindow.hide()
      miniWindow.webContents.send('mini-hidden')
    } else {
      const { screen } = require('electron')
      const cursor = screen.getCursorScreenPoint()
      const display = screen.getDisplayNearestPoint(cursor)
      const { width, height } = display.workAreaSize
      const x = Math.round(display.bounds.x + width / 2 - 250)
      const y = Math.round(display.bounds.y + height - 120)
      miniWindow.setPosition(x, y)
      miniWindow.show()
      miniWindow.focus()
      miniWindow.webContents.send('mini-shown')
    }
  })
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

let mainWindow, miniWindow, tray, cardWindow

app.whenReady().then(() => {
  createMainWindow()
  createMiniWindow()
  createTray()
  createCardWindow()

  const config = loadConfig()
  registerHotkey(config.hotkey || 'CommandOrControl+Space')
})

app.on('window-all-closed', () => {})
app.on('will-quit', () => globalShortcut.unregisterAll())

// ─── IPC ──────────────────────────────────────────────────────────────────────

ipcMain.on('open-feature', (event, name) => openFeatureWindow(name))
ipcMain.on('open-board',   (event, { id, title }) => openBoardWindow(id, title))

ipcMain.on('resize-mini', (event, height) => {
  if (miniWindow) miniWindow.setSize(500, Math.min(height, 400))
})

ipcMain.on('show-card', (event, { data, type }) => {
  if (!cardWindow) return
  const [mx, my] = miniWindow.getPosition()
  cardWindow.setPosition(mx, my - 420)
  cardWindow.show()
  cardWindow.focus()
  setTimeout(() => cardWindow.webContents.send('card-data', { data, type }), 50)
})

ipcMain.on('hide-card',    () => { if (cardWindow) cardWindow.hide() })
ipcMain.on('resize-card',  (event, height) => {
  if (cardWindow) cardWindow.setSize(340, Math.min(height + 2, 600))
})

ipcMain.on('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})

ipcMain.on('window-close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.hide()
})
