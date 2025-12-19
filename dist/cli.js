#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const registry_1 = require("./core/registry");
const macos_1 = require("./platforms/macos");
const storage_1 = require("./core/storage");
const chrome_1 = require("./adapters/browsers/chrome");
const safari_1 = require("./adapters/browsers/safari");
const os_1 = __importDefault(require("os"));
// Initialize System
const registry = registry_1.PluginRegistry.getInstance();
// Platform Detection
if (process.platform === 'darwin') {
    registry.setPlatform(new macos_1.MacOSPlatform());
}
else {
    console.error('OS not supported yet:', process.platform);
    process.exit(1);
}
// Register Adapters
registry.registerTracker(new chrome_1.ChromeAdapter());
registry.registerTracker(new safari_1.SafariAdapter());
// MacOSPlatform provides the generic tracker as fallback via getAppTracker() 
// but we should probably force register it if we want it to be finding generic apps?
// No, the logic in 'save' below will ask platform or registry.
// Ideally, we register the Generic one last? 
// The MacOSPlatform implementation wraps the generic tracker. 
// Let's rely on the strategy defined below.
const storage = new storage_1.StorageManager();
const program = new commander_1.Command();
program
    .name('yg')
    .description('Universal Session Hoarder')
    .version('2.0.0');
program.command('save')
    .argument('<name>', 'Session name')
    .description('Save current session')
    .action(async (name) => {
    console.log(`Saving session "${name}"...`);
    try {
        const platform = registry.getPlatform();
        const apps = await platform.listRunningApps();
        const items = [];
        for (const app of apps) {
            // Find specific tracker
            let tracker = registry.getTrackerFor(app);
            // If no specific tracker, use platform default
            if (!tracker) {
                tracker = platform.getAppTracker(app);
            }
            if (tracker) {
                // console.log(`Capturing ${app.name}...`);
                try {
                    const payload = await tracker.capture(app);
                    // Only add if we captured something meaningful (e.g. windows exist)
                    if (payload && (payload.windows && payload.windows.length > 0)) {
                        items.push({
                            type: tracker instanceof chrome_1.ChromeAdapter || tracker instanceof safari_1.SafariAdapter ? 'browser' : 'app',
                            id: app.bundleId || app.name,
                            name: app.name,
                            payload
                        });
                    }
                }
                catch (e) {
                    console.error(`Failed to capture ${app.name}:`, e);
                }
            }
        }
        const session = {
            meta: {
                version: 2,
                created: Date.now(),
                os: platform.currentOS,
                hostname: os_1.default.hostname()
            },
            items
        };
        await storage.saveSession(name, session);
        console.log(`Saved ${items.length} applications to session "${name}".`);
    }
    catch (e) {
        console.error('Save failed:', e);
    }
});
program.command('restore')
    .argument('<name>', 'Session name')
    .description('Restore a session')
    .action(async (name) => {
    console.log(`Restoring session "${name}"...`);
    try {
        const session = await storage.loadSession(name);
        if (!session) {
            console.error('Session not found.');
            return;
        }
        const platform = registry.getPlatform();
        for (const item of session.items) {
            // Find tracker that can restore this
            // 1. Try registered specific trackers
            let tracker = registry.getAllTrackers().find(t => t.canRestore(item));
            // 2. Fallback to platform generic
            if (!tracker) {
                // Create a dummy process object just to get the generic tracker?
                // Or cast platform generic tracker.
                // MacOSPlatform returns GenericAppleScriptTracker which returns true for canRestore.
                // Ideally we should expose the generic tracker cleaner.
                // Let's assume generic tracker is always available via platform logic.
                tracker = platform.getAppTracker({ pid: 0, name: item.name }); // Dummy process
            }
            if (tracker) {
                console.log(`Restoring ${item.name}...`);
                try {
                    await tracker.restore(item);
                }
                catch (e) {
                    console.error(`Failed to restore ${item.name}:`, e);
                }
            }
            else {
                console.warn(`No tracker found for ${item.name}`);
            }
        }
        console.log('Restore complete.');
    }
    catch (e) {
        console.error('Restore failed:', e);
    }
});
program.command('list')
    .description('List sessions')
    .action(async () => {
    const sessions = await storage.listSessions();
    if (sessions.length === 0)
        console.log('No sessions found.');
    else
        sessions.forEach(s => console.log(` - ${s}`));
});
program.command('delete')
    .argument('<name>')
    .action(async (name) => {
    await storage.deleteSession(name);
    console.log(`Deleted session ${name}`);
});
program.parse();
