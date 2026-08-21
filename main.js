const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');

let mainWindow;

function isSafeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'build/icon.png'), // <-- THIS IS THE ONLY ADDED LINE
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  mainWindow.webContents.on(
    'will-attach-webview',
    (event, webPreferences, params) => {
      delete webPreferences.preload;
      delete webPreferences.preloadURL;

      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;

      if (!isSafeExternalUrl(params.src)) {
        event.preventDefault();
      }
    }
  );

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false)
  );
  ses.setPermissionCheckHandler(() => false);

  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() !== 'webview') return;

    contents.on('will-navigate', (event, url) => {
      if (!isSafeExternalUrl(url)) {
        event.preventDefault();
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
      if (isSafeExternalUrl(url)) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
