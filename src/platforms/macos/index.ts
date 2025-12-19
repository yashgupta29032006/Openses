import { PlatformAdapter, AppProcess, AppTracker } from '../../core/interfaces';
import { runAppleScript } from './applescript';
import { AppleScriptAppTracker } from './tracker';
import { spawn } from 'child_process';

export class MacOSPlatform implements PlatformAdapter {
    private genericTracker = new AppleScriptAppTracker();

    get currentOS(): string {
        return 'macos';
    }

    async listRunningApps(): Promise<AppProcess[]> {
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

        const raw = await runAppleScript(script);
        return raw.split('\n').filter(Boolean).map(line => {
            const [name, pidStr, bundleId] = line.split('|');
            return {
                name,
                pid: parseInt(pidStr, 10),
                bundleId: bundleId === 'missing value' ? undefined : bundleId
            };
        });
    }

    async activateApp(pid: number): Promise<void> {
        // Can activate by PID via AppleScript or kill signal (not what we want)
        // Generally activate by Name is easier in AS, but we have PID.
        // We can use system events to set frontmost.
        const script = `
        tell application "System Events"
            set frontmost of (first process whose unix id is ${pid}) to true
        end tell
        `;
        await runAppleScript(script);
    }

    async openApp(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn('open', ['-a', path]);
            child.on('close', code => {
                if (code === 0) resolve();
                else reject(new Error(`Failed to open ${path}`));
            });
        });
    }

    getAppTracker(process: AppProcess): AppTracker {
        // Logic to choose tracker:
        // 1. Check if PluginRegistry has a specific match (handled by caller typically, or we do it here?)
        // The Interface says platform returns it? 
        // Actually typically Registry holds trackers. Platform might have updated logic.
        // Let's assume the caller uses Registry, but fallback to this platform's generic capability.
        return this.genericTracker;
    }
}
