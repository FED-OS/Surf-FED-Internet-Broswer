const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // webviewTag must be enabled to embed pages inside <webview>
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset'
  });

  mainWindow.loadFile('index.html');

  // Uncomment to open devtools automatically
  // mainWindow.webContents.openDevTools();
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

// Basic IPC handlers (window controls, new window requests, etc.)
ipcMain.on('new-window-request', (event, url) => {
  createWindow();
});
