const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openWindow: (incognito) => ipcRenderer.invoke('open-window', incognito),
  getVersion: () => ipcRenderer.invoke('get-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  writeFile: (path, data) => ipcRenderer.invoke('write-file', path, data),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  clearBrowsingData: (options) => ipcRenderer.invoke('clear-browsing-data', options),
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  setDefaultBrowser: () => ipcRenderer.invoke('set-default-browser'),
});
