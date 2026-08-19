const { app, BrowserWindow, Menu, shell, dialog, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let incognitoWindows = [];

function createWindow(incognito = false) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      partition: incognito ? `persist:incognito-${Date.now()}` : 'persist:default',
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  win.loadFile('index.html');
  Menu.setApplicationMenu(null);

  if (!incognito) {
    mainWindow = win;
    mainWindow.on('closed', () => { mainWindow = null; });
  } else {
    incognitoWindows.push(win);
    win.on('closed', () => {
      incognitoWindows = incognitoWindows.filter(w => w !== win);
    });
  }

  return win;
}

// IPC: Open new window (incognito or not)
ipcMain.handle('open-window', (event, incognito = false) => {
  createWindow(incognito);
});

// IPC: Get app version
ipcMain.handle('get-version', () => app.getVersion());

// IPC: Open external link
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// IPC: Show save dialog
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

// IPC: Write file
ipcMain.handle('write-file', (event, filePath, data) => {
  fs.writeFileSync(filePath, data);
});

// IPC: Read file
ipcMain.handle('read-file', (event, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

// IPC: Clear browsing data
ipcMain.handle('clear-browsing-data', async (event, options) => {
  const ses = session.defaultSession;
  await ses.clearCache();
  await ses.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'websql'] });
  // Also clear history (stored in localStorage, but we handle that in renderer)
  return true;
});

// IPC: Get default download path
ipcMain.handle('get-download-path', () => {
  return app.getPath('downloads');
});

// IPC: Set as default browser (Windows only)
ipcMain.handle('set-default-browser', () => {
  if (process.platform === 'win32') {
    const cmd = `cmd /c assoc .html=htmlfile & ftype htmlfile="${process.execPath}" "%1"`;
    require('child_process').execSync(cmd);
    return true;
  }
  return false;
});

// App ready
app.whenReady().then(() => {
  createWindow(false);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow(false);
});
