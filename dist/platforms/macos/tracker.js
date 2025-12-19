"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleScriptAppTracker = void 0;
const applescript_1 = require("./applescript");
class AppleScriptAppTracker {
    getName() {
        return 'GenericAppleScriptTracker';
    }
    matches(process) {
        // This is the fallback tracker, so it matches everything not handled by specific ones.
        return true;
    }
    canRestore(item) {
        return true;
    }
    async capture(process) {
        const appName = process.name;
        const script = `
        tell application "${appName}"
            set output to ""
            try
                repeat with w in windows
                    set b to bounds of w
                    set t to name of w
                    set output to output & t & "|" & (b as string) & ";;"
                end repeat
            on error
                -- App might not be scriptable or have windows
            end try
            return output
        end tell
        `;
        try {
            const raw = await (0, applescript_1.runAppleScript)(script);
            if (!raw)
                return { windows: [] };
            const windows = raw.split(';;').filter(Boolean).map(line => {
                const parts = line.split('|');
                const title = parts[0];
                const boundsStr = parts[1] || "";
                // bounds: x, y, x2, y2 (or similar)
                const coords = boundsStr.replace(/\s/g, '').split(',').map(Number);
                if (coords.length < 4)
                    return null;
                // Standardize to x,y,w,h
                // AppleScript often returns L,T,R,B
                return {
                    title,
                    bounds: {
                        x: coords[0],
                        y: coords[1],
                        w: coords[2] - coords[0],
                        h: coords[3] - coords[1]
                    }
                };
            }).filter(Boolean);
            return { windows };
        }
        catch (e) {
            // console.warn(`Failed to capture generic app state for ${appName}:`, e);
            return { windows: [] };
        }
    }
    async restore(item) {
        const appName = item.name;
        const windows = item.payload.windows || [];
        // Activate
        await (0, applescript_1.runAppleScript)(`tell application "${appName}" to activate`);
        // We can't generically "create" windows for most apps (like Calculator, Notes, etc) 
        // without knowing specific commands (make new document etc). 
        // But we can try to resize existing ones if they match title?
        // Or just move the frontmost ones.
        // Simple Generic Strategy: 
        // Just try to set bounds of existing windows to match saved ones
        // This is "best effort".
        let i = 1;
        for (const win of windows) {
            const { x, y, w, h } = win.bounds;
            const R = x + w;
            const B = y + h;
            try {
                // Try to find window by title? Hard generically. 
                // We will just set bounds of window i
                await (0, applescript_1.runAppleScript)(`tell application "${appName}" to set bounds of window ${i} to {${x}, ${y}, ${R}, ${B}}`);
                i++;
            }
            catch (e) {
                // ignore
            }
        }
    }
}
exports.AppleScriptAppTracker = AppleScriptAppTracker;
