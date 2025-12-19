"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacOSPlatform = void 0;
const applescript_1 = require("./applescript");
const tracker_1 = require("./tracker");
const child_process_1 = require("child_process");
class MacOSPlatform {
    genericTracker = new tracker_1.AppleScriptAppTracker();
    get currentOS() {
        return 'macos';
    }
    async listRunningApps() {
        // Use System Events to get processes that are not background only
        const script = `
        tell application "System Events"
            set procs to processes where background only is false
            set output to ""
            repeat with p in procs
                set temp to name of p & "|" & unix id of p & "|" & bundle identifier of p
                set output to output & temp & "\\n"
            end repeat
            return output
        end tell
        `;
        const raw = await (0, applescript_1.runAppleScript)(script);
        return raw.split('\n').filter(Boolean).map(line => {
            const [name, pidStr, bundleId] = line.split('|');
            return {
                name,
                pid: parseInt(pidStr, 10),
                bundleId: bundleId === 'missing value' ? undefined : bundleId
            };
        });
    }
    async activateApp(pid) {
        // Can activate by PID via AppleScript or kill signal (not what we want)
        // Generally activate by Name is easier in AS, but we have PID.
        // We can use system events to set frontmost.
        const script = `
        tell application "System Events"
            set frontmost of (first process whose unix id is ${pid}) to true
        end tell
        `;
        await (0, applescript_1.runAppleScript)(script);
    }
    async openApp(path) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)('open', ['-a', path]);
            child.on('close', code => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Failed to open ${path}`));
            });
        });
    }
    getAppTracker(process) {
        // Logic to choose tracker:
        // 1. Check if PluginRegistry has a specific match (handled by caller typically, or we do it here?)
        // The Interface says platform returns it? 
        // Actually typically Registry holds trackers. Platform might have updated logic.
        // Let's assume the caller uses Registry, but fallback to this platform's generic capability.
        return this.genericTracker;
    }
}
exports.MacOSPlatform = MacOSPlatform;
