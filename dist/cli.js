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
const registry = registry_1.PluginRegistry.getInstance();
if (process.platform === 'darwin') {
    registry.setPlatform(new macos_1.MacOSPlatform());
}
else {
    console.error('OS not supported yet:', process.platform);
    process.exit(1);
}
registry.registerTracker(new chrome_1.ChromeAdapter());
registry.registerTracker(new safari_1.SafariAdapter());
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
        const { RelevanceEngine } = require('./core/relevance');
        const platform = registry.getPlatform();
        const apps = await platform.listRunningApps();
        const items = [];
        console.log(`Found ${apps.length} running apps. Filtering...`);
        for (const app of apps) {
            // 1. Gather Signals
            // console.log(`Inspecting ${app.name}...`);
            const resources = platform.getProcessResources ? await platform.getProcessResources(app.pid) : { cpu: 0, mem: 0 };
            // We don't have affordable window count here without checking ALL apps.
            // But lsappinfo implicitly filters for "visible" or "adherent" apps usually.
            // We'll trust the RelevanceEngine to handle what we have.
            const signal = {
                pid: app.pid,
                hasWindows: false, // We don't know yet, expensive to check
                isFrontmost: false, // We could know this if we parsed lsappinfo flags, for now assume false or safe default
                cpuPercent: resources.cpu,
                memUsageMB: resources.mem
            };
            // 2. Calculate Relevance
            const score = RelevanceEngine.calculateScore(app, signal);
            // 3. Select Tracker
            let tracker = registry.getTrackerFor(app);
            let trackerType = 'plugin';
            // Debug log to see where we hang
            console.log(`Processing ${app.name} (${app.pid})...`);
            if (!tracker) {
                // EXPLICIT FILTERING ONLY
                if (RelevanceEngine.shouldExclude(app)) {
                    // console.log(`Skipping system app: ${app.name}`);
                    continue;
                }
                // Fallback to Universal Tracker for EVERYTHING else
                tracker = platform.getAppTracker(app);
                trackerType = 'universal';
            }
            if (tracker) {
                try {
                    const payload = await tracker.capture(app);
                    // 4. Validate Payload
                    // We strictly want to save everything that wasn't excluded by the RelevanceEngine.
                    // Even if it has no windows, we should track it for relaunch purposes.
                    const hasContent = payload && ((payload.windows && payload.windows.length > 0) ||
                        (trackerType === 'plugin') ||
                        (!!payload.bundleId) // If we have a Bundle ID, we can at least relaunch it
                    );
                    if (hasContent) {
                        items.push({
                            type: trackerType === 'plugin' ? 'browser' : 'app', // Simplified type
                            id: app.bundleId || app.name,
                            name: app.name,
                            payload,
                            confidence: trackerType === 'plugin' ? 'high' : 'medium',
                            trackerType,
                            metadata: { relevanceScore: score }
                        });
                        console.log(`Captured ${app.name} (Score: ${score.toFixed(2)})`);
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
        const restorePromises = session.items.map(async (item) => {
            // Find tracker that can restore this
            // 1. Try registered specific trackers
            let tracker = registry.getAllTrackers().find(t => t.canRestore(item));
            // 2. Fallback to platform generic
            if (!tracker) {
                tracker = platform.getAppTracker({ pid: 0, name: item.name });
            }
            if (tracker) {
                console.log(`[Start] Restoring ${item.name}...`);
                try {
                    await tracker.restore(item);
                    console.log(`[Done] Restored ${item.name}`);
                }
                catch (e) {
                    console.error(`[Error] Failed to restore ${item.name}:`, e);
                }
            }
            else {
                console.warn(`[Warn] No tracker found for ${item.name}`);
            }
        });
        await Promise.allSettled(restorePromises);
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
