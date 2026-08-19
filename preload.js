const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('browserAPI', {
  newWindow: (url) => ipcRenderer.send('new-window-request', url)
});
