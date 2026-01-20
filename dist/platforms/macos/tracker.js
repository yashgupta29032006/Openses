"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalAppTracker = void 0;
const applescript_1 = require("./applescript");
const child_process_1 = require("child_process");
class UniversalAppTracker {
    getName() {
        return 'UniversalFallbackTracker';
    }
    matches(process) {
        // This is the fallback, so it matches everything not handled by plugins
        return true;
    }
    canRestore(item) {
        return item.trackerType === 'universal';
    }
    async capture(process) {
        const appName = process.name;
        // Universal Capture via System Events (Accessibility API)
        // This works on almost ALL apps (Electron, SwiftUI, Catalyst, etc.)
        // unlike 'tell application "App"' which requires a dictionary.
        const script = `
        tell application "System Events"
            if not (exists process "${appName}") then return ""
            
            set winList to ""
            tell process "${appName}"
                repeat with w in windows
                    try
                        set t to name of w
                        set p to position of w
                        set s to size of w
                        -- Format: Title|X,Y|W,H;;
                        set winList to winList & t & "|" & (item 1 of p) & "," & (item 2 of p) & "|" & (item 1 of s) & "," & (item 2 of s) & ";;"
                    on error
                        -- Skip windows efficiently
                    end try
                end repeat
            end tell
            return winList
        end tell
        `;
        let windows = [];
        try {
            const raw = await (0, applescript_1.runAppleScript)(script);
            if (raw) {
                windows = raw.split(';;').filter(Boolean).map(line => {
                    const parts = line.split('|'); // Title | X,Y | W,H
                    if (parts.length < 3)
                        return null;
                    const title = parts[0];
                    const [x, y] = parts[1].split(',').map(Number);
                    const [w, h] = parts[2].split(',').map(Number);
                    return {
                        title,
                        bounds: { x, y, w, h }
                    };
                }).filter((w) => !!w);
            }
        }
        catch (e) {
            console.error(`Universal capture failed for ${appName}:`, e);
        }
        // Return payload with low/medium confidence
        return {
            windows,
            bundleId: process.bundleId,
            executablePath: process.path
        };
    }
    async restore(item) {
        const appName = item.name;
        const bundleId = item.payload.bundleId;
        const windows = item.payload.windows || [];
        // 1. Launch the app
        console.log(`[Universal] Launching ${appName} (${bundleId || 'No ID'})...`);
        if (bundleId) {
            await this.openBundle(bundleId);
        }
        else {
            // Fallback to name-based launch
            await (0, applescript_1.runAppleScript)(`tell application "${appName}" to activate`);
        }
        // 2. Wait for app to be ready (naive wait, can be improved)
        await new Promise(r => setTimeout(r, 2000));
        // 3. Restore Windows via System Events
        let i = 1;
        for (const win of windows) {
            const { x, y, w, h } = win.bounds;
            // Sanity check for valid bounds
            if (w < 10 || h < 10)
                continue;
            const script = `
            tell application "System Events"
                tell process "${appName}"
                    if exists window ${i} then
                        set position of window ${i} to {${x}, ${y}}
                        set size of window ${i} to {${w}, ${h}}
                    end if
                end tell
            end tell
            `;
            try {
                await (0, applescript_1.runAppleScript)(script);
                i++;
            }
            catch (e) {
                // Ignore errors (window might not exist yet)
            }
        }
    }
    async openBundle(bundleId) {
        return new Promise((resolve) => {
            // open -b com.package.name
            const child = (0, child_process_1.spawn)('open', ['-b', bundleId]);
            child.on('close', () => resolve());
            // Also detach so we don't hold it
            child.unref();
        });
    }
}
exports.UniversalAppTracker = UniversalAppTracker;
