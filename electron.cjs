const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const CONFIG_PATH = path.join(app.getPath('userData'), 'jarvis-config.json')

let mainWindow
let miniWindow
let tray
let cardWindow


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

// add these IPC handlers inside app.whenReady():
ipcMain.handle('get-config', () => loadConfig())
ipcMain.handle('save-config', (event, config) => {
  saveConfig(config)
  return true
})

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

  mainWindow.loadURL('http://localhost:5173')

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

  miniWindow.loadURL('http://localhost:5173/#mini')
  miniWindow.hide()

  miniWindow.on('blur', () => {
    miniWindow.hide()
  })
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'src/assets/tray-icon.png'))

  const menu = Menu.buildFromTemplate([
    { label: 'Open Jarvis', click: () => { mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.exit() } },
  ])

  tray.setToolTip('Jarvis')
  tray.setContextMenu(menu)

  tray.on('click', () => {
    mainWindow.show()
    mainWindow.focus()
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
      resizable: false,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    cardWindow.loadURL('http://localhost:5173/#card')

  }

app.whenReady().then(() => {
  createMainWindow()
  createMiniWindow()
  createTray()
  createCardWindow()

  globalShortcut.register('CommandOrControl+Shift+J', () => {
    if (miniWindow.isVisible()) {
      miniWindow.hide()
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
    }
  })
})

app.on('window-all-closed', () => {})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.on('resize-mini', (event, height) => {
  if (miniWindow) {
    miniWindow.setSize(500, Math.min(height, 400))
  }
})

ipcMain.on('show-card', (event, { data, type }) => {
  console.log('show-card received:', type, JSON.stringify(data).slice(0, 100))
  if (!cardWindow) {
    console.log('cardWindow is null!')
    return
  }

  // position it above the mini bar
  const miniPos = miniWindow.getPosition()
  const miniSize = miniWindow.getSize()
  cardWindow.setPosition(miniPos[0], miniPos[1] - 420)
  cardWindow.webContents.send('card-data', { data, type })
  cardWindow.show()
  cardWindow.focus()
})

ipcMain.on('hide-card', () => {
  if (cardWindow) cardWindow.hide()
})

ipcMain.on('resize-card', (event, height) => {
  if (cardWindow) cardWindow.setSize(340, Math.min(height + 2, 600))
})
