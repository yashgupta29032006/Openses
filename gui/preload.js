const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getSessions: () => ipcRenderer.invoke('get-sessions'),
    restoreSession: (name) => ipcRenderer.invoke('restore-session', name),
    saveSession: (name) => ipcRenderer.invoke('save-session', name),
    deleteSession: (name) => ipcRenderer.invoke('delete-session', name),
    saveSessionOrder: (order) => ipcRenderer.invoke('save-session-order', order)
});
