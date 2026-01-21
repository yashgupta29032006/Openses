const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// We try to require the storage manager from the built dist
let StorageManager;
try {
    const storageModule = require('../dist/core/storage');
    StorageManager = storageModule.StorageManager;
} catch (e) {
    console.error("Failed to load StorageManager. Ensure the project is built (npm run build in root).", e);
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        titleBarStyle: 'hiddenInset',
        vibrancy: 'under-window', // macOS blur
        visualEffectState: 'active',
        backgroundColor: '#00000000', // transparent for vibrancy to work
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // sandbox: true
        }
    });

    win.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-sessions', async () => {
    if (!StorageManager) return [];
    try {
        const storage = new StorageManager();
        return await storage.listSessionSummaries();
    } catch (error) {
        console.error("Error listing sessions:", error);
        return [];
    }
});

ipcMain.handle('restore-session', async (event, name) => {
    return runCli('restore', name);
});

ipcMain.handle('save-session', async (event, name) => {
    return runCli('save', name);
});

ipcMain.handle('delete-session', async (event, name) => {
    return runCli('delete', name);
});

function runCli(command, arg) {
    return new Promise((resolve, reject) => {
        const cliPath = path.resolve(__dirname, '../dist/cli.js');
        const child = spawn(process.execPath, [cliPath, command, arg]);

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => output += data.toString());
        child.stderr.on('data', (data) => error += data.toString());

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, output });
            } else {
                reject(new Error(error || output || 'Unknown CLI Error'));
            }
        });
    });
}
