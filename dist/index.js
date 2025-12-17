"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.listSessions = void 0;
exports.save = save;
exports.restore = restore;
const session_1 = require("./storage/session");
Object.defineProperty(exports, "listSessions", { enumerable: true, get: function () { return session_1.listSessions; } });
Object.defineProperty(exports, "deleteSession", { enumerable: true, get: function () { return session_1.deleteSession; } });
const browser_1 = require("./managers/browser");
const vscode_1 = require("./managers/vscode");
const finder_1 = require("./managers/finder");
// We can add more apps here
const BROWSERS = ['Google Chrome', 'Safari', 'Brave Browser'];
async function save(name) {
    console.log(`Saving session: ${name}...`);
    const browsers = [];
    for (const b of BROWSERS) {
        const state = await (0, browser_1.getBrowserState)(b);
        if (state)
            browsers.push(state);
    }
    const apps = [];
    const vscode = await (0, vscode_1.getVSCodeState)();
    if (vscode)
        apps.push(vscode);
    const finder = await (0, finder_1.getFinderState)();
    if (finder)
        apps.push(finder);
    const session = {
        name,
        timestamp: Date.now(),
        browsers,
        apps
    };
    await (0, session_1.saveSession)(name, session);
    console.log(`Session "${name}" saved!`);
}
async function restore(name) {
    console.log(`Restoring session: ${name}...`);
    const session = await (0, session_1.loadSession)(name);
    if (!session) {
        console.error(`Session "${name}" not found.`);
        return;
    }
    // Restore Browsers
    for (const b of session.browsers) {
        console.log(`Restoring ${b.appName}...`);
        await (0, browser_1.restoreBrowser)(b);
    }
    // Restore Apps
    for (const app of session.apps) {
        console.log(`Restoring ${app.appName}...`);
        if (app.appName === 'Finder') {
            await (0, finder_1.restoreFinder)(app);
        }
        else if (app.appName === 'Code') {
            await (0, vscode_1.restoreVSCode)(app);
        }
    }
    console.log(`Session "${name}" restored!`);
}
