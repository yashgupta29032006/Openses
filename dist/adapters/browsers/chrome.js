"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeAdapter = void 0;
const abstract_1 = require("./abstract");
const applescript_1 = require("../../platforms/macos/applescript");
class ChromeAdapter extends abstract_1.AbstractBrowserAdapter {
    getName() {
        return 'ChromeAdapter';
    }
    supportedProcessNames() {
        return ['Google Chrome', 'Brave Browser', 'Arc', 'Microsoft Edge'];
    }
    async captureRaw(process) {
        const appName = process.name;
        const script = `
        set output to ""
        tell application "${appName}"
            repeat with w in windows
                set output to output & "WINDOW_START|" & (id of w) & "|" & (bounds of w as string) & "||"
                set activeId to id of active tab of w
                repeat with t in tabs of w
                    set tUrl to URL of t
                    set tId to id of t
                    set isCurrent to (tId = activeId)
                    
                    set scrollY to "0"
                    if isCurrent then
                        try
                            set scrollY to execute t javascript "window.scrollY / document.body.scrollHeight"
                        end try
                    end if

                    set output to output & tUrl & "::" & scrollY & "::" & isCurrent & ";;"
                end repeat
                set output to output & "WINDOW_END" & "***"
            end repeat
        end tell
        return output
        `;
        try {
            const raw = await (0, applescript_1.runAppleScript)(script);
            return this.parseAppleScriptOutput(raw);
        }
        catch (e) {
            console.error(`Error capturing ${appName}:`, e);
            return { windows: [] };
        }
    }
    parseAppleScriptOutput(raw) {
        const windows = [];
        const blocks = raw.split('***').filter(Boolean);
        for (const block of blocks) {
            const [header, body] = block.split('||');
            if (!body)
                continue;
            const headerParts = header.split('|');
            const boundsStr = headerParts[2];
            const coords = boundsStr.replace(/\s/g, '').split(',').map(Number);
            const bounds = { x: coords[0], y: coords[1], w: coords[2] - coords[0], h: coords[3] - coords[1] };
            const cleanBody = body.replace('WINDOW_END', '');
            const tabStrings = cleanBody.split(';;').filter(Boolean);
            const tabs = [];
            let activeTabIndex = 0;
            tabStrings.forEach((ts, idx) => {
                const [url, scroll, isCurrent] = ts.split('::');
                if (url && url !== 'missing value') {
                    tabs.push({
                        url,
                        scrollRatio: parseFloat(scroll) || 0,
                        isActive: isCurrent === 'true'
                    });
                    if (isCurrent === 'true')
                        activeTabIndex = idx;
                }
            });
            if (tabs.length > 0) {
                windows.push({ tabs, activeTabIndex, bounds });
            }
        }
        return { windows };
    }
    async restoreRaw(state) {
        throw new Error("Method not implemented via restoreRaw. see restore()");
    }
    async restore(item) {
        const appName = item.name;
        const state = item.payload;
        await (0, applescript_1.runAppleScript)(`tell application "${appName}" to activate`);
        for (const win of state.windows) {
            let isFirst = true;
            await (0, applescript_1.runAppleScript)(`tell application "${appName}" to make new window`);
            for (const tab of win.tabs) {
                if (isFirst) {
                    await (0, applescript_1.runAppleScript)(`tell application "${appName}" to set URL of active tab of window 1 to "${tab.url}"`);
                    isFirst = false;
                }
                else {
                    await (0, applescript_1.runAppleScript)(`tell application "${appName}" to make new tab at end of tabs of window 1 with properties {URL:"${tab.url}"}`);
                }
            }
            const { x, y, w, h } = win.bounds || { x: 0, y: 0, w: 800, h: 600 };
            const R = x + w;
            const B = y + h;
            try {
                await (0, applescript_1.runAppleScript)(`tell application "${appName}" to set bounds of window 1 to {${x}, ${y}, ${R}, ${B}}`);
            }
            catch { }
        }
    }
}
exports.ChromeAdapter = ChromeAdapter;
