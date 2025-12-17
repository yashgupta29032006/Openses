import { saveSession, loadSession, listSessions, deleteSession, SessionData } from './storage/session';
import { getBrowserState, restoreBrowser } from './managers/browser';
import { getVSCodeState, restoreVSCode } from './managers/vscode';
import { getFinderState, restoreFinder } from './managers/finder';

// We can add more apps here
const BROWSERS = ['Google Chrome', 'Safari', 'Brave Browser'];

export async function save(name: string) {
    console.log(`Saving session: ${name}...`);

    const browsers = [];
    for (const b of BROWSERS) {
        const state = await getBrowserState(b);
        if (state) browsers.push(state);
    }

    const apps = [];
    const vscode = await getVSCodeState();
    if (vscode) apps.push(vscode);

    const finder = await getFinderState();
    if (finder) apps.push(finder);

    const session: SessionData = {
        name,
        timestamp: Date.now(),
        browsers,
        apps
    };

    await saveSession(name, session);
    console.log(`Session "${name}" saved!`);
}

export async function restore(name: string) {
    console.log(`Restoring session: ${name}...`);
    const session = await loadSession(name);
    if (!session) {
        console.error(`Session "${name}" not found.`);
        return;
    }

    // Restore Browsers
    for (const b of session.browsers) {
        console.log(`Restoring ${b.appName}...`);
        await restoreBrowser(b);
    }

    // Restore Apps
    for (const app of session.apps) {
        console.log(`Restoring ${app.appName}...`);
        if (app.appName === 'Finder') {
            await restoreFinder(app);
        } else if (app.appName === 'Code') {
            await restoreVSCode(app);
        }
    }

    console.log(`Session "${name}" restored!`);
}

export { listSessions, deleteSession };
