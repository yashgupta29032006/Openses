#!/usr/bin/env node
import { Command } from 'commander';
import { PluginRegistry } from './core/registry';
import { MacOSPlatform } from './platforms/macos';
import { StorageManager } from './core/storage';
import { SessionData, SessionItem } from './core/interfaces';
import { ChromeAdapter } from './adapters/browsers/chrome';
import { SafariAdapter } from './adapters/browsers/safari';
import os from 'os';


const registry = PluginRegistry.getInstance();


if (process.platform === 'darwin') {
    registry.setPlatform(new MacOSPlatform());
} else {
    console.error('OS not supported yet:', process.platform);
    process.exit(1);
}


registry.registerTracker(new ChromeAdapter());
registry.registerTracker(new SafariAdapter());


const storage = new StorageManager();
const program = new Command();

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
            const items: SessionItem[] = [];

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
                let trackerType: 'plugin' | 'universal' = 'plugin';

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
                        const hasContent = payload && (
                            (payload.windows && payload.windows.length > 0) ||
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
                    } catch (e) {
                        console.error(`Failed to capture ${app.name}:`, e);
                    }
                }
            }

            const session: SessionData = {
                meta: {
                    version: 2,
                    created: Date.now(),
                    os: platform.currentOS,
                    hostname: os.hostname()
                },
                items
            };

            await storage.saveSession(name, session);
            console.log(`Saved ${items.length} applications to session "${name}".`);
        } catch (e) {
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
                    } catch (e) {
                        console.error(`[Error] Failed to restore ${item.name}:`, e);
                    }
                } else {
                    console.warn(`[Warn] No tracker found for ${item.name}`);
                }
            });

            await Promise.allSettled(restorePromises);
            console.log('Restore complete.');
        } catch (e) {
            console.error('Restore failed:', e);
            process.exit(1);
        }
        process.exit(0);
    });

program.command('list')
    .description('List sessions')
    .action(async () => {
        const summaries = await storage.listSessionSummaries();

        if (summaries.length === 0) {
            console.log('No sessions found.');
            return;
        }

        console.log('\nSessions:');
        for (const s of summaries) {
            const dateObj = new Date(s.created);
            // YYYY-MM-DD
            const dateStr = dateObj.toLocaleDateString('sv');
            // HH:MM (24h)
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            // Format: YYYY-MM-DD HH:MM  name (padded)  N apps  [Confidence]
            const namePad = s.id.padEnd(25).slice(0, 25);
            const countStr = `${s.appCount} apps`.padEnd(8);

            console.log(`${dateStr} ${timeStr}  ${namePad}  ${countStr}   [${s.confidence}]`);
        }
        console.log('');
    });

program.command('delete')
    .argument('<name>')
    .action(async (name) => {
        await storage.deleteSession(name);
        console.log(`Deleted session ${name}`);
    });

program.parse();
