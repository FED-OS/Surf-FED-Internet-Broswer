const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

// Use our placeholder icon by default. Swap the files inside assets/icons/
// (keep the same names/sizes) to change the app's icon everywhere.
const ICON_PATH = path.join(__dirname, 'assets', 'icons', 'icon.png');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: ICON_PATH,
    title: 'Electron Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Needed so <webview> tags work inside the renderer
      webviewTag: true,
    },
  });

  mainWindow.loadFile('index.html');

  // Uncomment while developing to open devtools automatically:
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Simple IPC handlers the renderer can call for window chrome actions.
ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow && mainWindow.close());
