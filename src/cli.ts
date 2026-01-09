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
            const platform = registry.getPlatform();
            const apps = await platform.listRunningApps();
            const items: SessionItem[] = [];

            for (const app of apps) {
                // Find specific tracker
                let tracker = registry.getTrackerFor(app);

                // If no specific tracker, use platform default
                if (!tracker) {
                    tracker = platform.getAppTracker(app);
                }

                if (tracker) {

                    try {
                        const payload = await tracker.capture(app);
                        // Only add if we captured something meaningful (e.g. windows exist)
                        if (payload && (payload.windows && payload.windows.length > 0)) {
                            items.push({
                                type: tracker instanceof ChromeAdapter || tracker instanceof SafariAdapter ? 'browser' : 'app',
                                id: app.bundleId || app.name,
                                name: app.name,
                                payload
                            });
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

            for (const item of session.items) {
                // Find tracker that can restore this
                // 1. Try registered specific trackers
                let tracker = registry.getAllTrackers().find(t => t.canRestore(item));

                // 2. Fallback to platform generic
                if (!tracker) {

                    tracker = platform.getAppTracker({ pid: 0, name: item.name });
                }

                if (tracker) {
                    console.log(`Restoring ${item.name}...`);
                    try {
                        await tracker.restore(item);
                    } catch (e) {
                        console.error(`Failed to restore ${item.name}:`, e);
                    }
                } else {
                    console.warn(`No tracker found for ${item.name}`);
                }
            }
            console.log('Restore complete.');
        } catch (e) {
            console.error('Restore failed:', e);
        }
    });

program.command('list')
    .description('List sessions')
    .action(async () => {
        const sessions = await storage.listSessions();
        if (sessions.length === 0) console.log('No sessions found.');
        else sessions.forEach(s => console.log(` - ${s}`));
    });

program.command('delete')
    .argument('<name>')
    .action(async (name) => {
        await storage.deleteSession(name);
        console.log(`Deleted session ${name}`);
    });

program.parse();
