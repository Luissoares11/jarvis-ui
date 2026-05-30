const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain } = require('electron')
const path = require('path')

let mainWindow
let miniWindow
let tray

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

app.whenReady().then(() => {
  createMainWindow()
  createMiniWindow()
  createTray()

  globalShortcut.register('CommandOrControl+Space', () => {
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