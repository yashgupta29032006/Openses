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

let overlayWindow = null;

const createOverlayWindow = () => {
    overlayWindow = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        show: false, // Hidden by default
        hasShadow: false, // We draw our own
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    overlayWindow.loadFile('overlay.html');
    overlayWindow.setIgnoreMouseEvents(true); // Click-through by default when hidden/transparent

    // On focus/blur handling if needed
};

app.whenReady().then(() => {
    createWindow();
    createOverlayWindow(); // Init the overlay
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

ipcMain.handle('show-overlay', (event, content) => {
    if (overlayWindow) {
        overlayWindow.show();
        overlayWindow.setIgnoreMouseEvents(false); // Make interactive
        overlayWindow.webContents.send('set-content', content);
    }
});

ipcMain.handle('hide-overlay', () => {
    if (overlayWindow) {
        overlayWindow.hide();
        overlayWindow.setIgnoreMouseEvents(true);
    }
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

ipcMain.handle('save-session-order', async (event, order) => {
    if (!StorageManager) return { success: false, error: 'StorageManager not loaded' };
    try {
        const storage = new StorageManager();
        await storage.saveSessionOrder(order);
        return { success: true };
    } catch (error) {
        console.error("Error saving session order:", error);
        return { success: false, error: error.message };
    }
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
