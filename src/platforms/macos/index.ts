import { PlatformAdapter, AppProcess, AppTracker } from '../../core/interfaces';
import { runAppleScript } from './applescript';
import { UniversalAppTracker } from './tracker';
import { spawn } from 'child_process';

export class MacOSPlatform implements PlatformAdapter {
    private genericTracker = new UniversalAppTracker();

    get currentOS(): string {
        return 'macos';
    }

    async listRunningApps(): Promise<AppProcess[]> {
        // Method 1: Try lsappinfo (Fastest, but can hang)
        try {
            const raw = await new Promise<string>((resolve, reject) => {
                const { exec } = require('child_process');
                exec('lsappinfo list -info BundleID,BundlePath,Pid', { timeout: 2000 }, (err: any, stdout: string) => {
                    if (err) reject(err);
                    else resolve(stdout);
                });
            });

            const lines = raw.split('\n');
            const apps: AppProcess[] = [];

            // Regex to parse: "App Name" (PID) BundleID="id" BundlePath="path"
            const regex = /"([^"]+)"\s+\((\d+)\)\s+.*BundleID="([^"]*)"\s+.*BundlePath="([^"]*)"/;

            for (const line of lines) {
                const match = line.match(regex);
                if (match) {
                    const [_, name, pidStr, bundleId, path] = match;
                    apps.push({
                        name,
                        pid: parseInt(pidStr, 10),
                        bundleId,
                        path
                    });
                }
            }
            if (apps.length > 0) return apps;

        } catch (e) {
            console.warn("lsappinfo failed or timed out, falling back to System Events...", e);
        }

        // Method 2: Fallback to System Events (Slower, but uses our safe runAppleScript with timeout)
        const script = `
        tell application "System Events"
            set procs to processes where background only is false
            set output to ""
            repeat with p in procs
                try
                    set temp to name of p & "|" & unix id of p & "|" & bundle identifier of p
                    set output to output & temp & "\\n"
                end try
            end repeat
            return output
        end tell
        `;

        try {
            const raw = await runAppleScript(script);
            return raw.split('\n').filter(Boolean).map(line => {
                const parts = line.split('|');
                if (parts.length < 2) return null;
                const [name, pidStr, bundleId] = parts;
                const proc: AppProcess = {
                    name,
                    pid: parseInt(pidStr, 10),
                    bundleId: bundleId === 'missing value' ? undefined : bundleId
                };
                return proc;
            }).filter((p): p is AppProcess => p !== null);
        } catch (e) {
            console.error("System Events listing failed:", e);
            return [];
        }
    }

    async activateApp(pid: number): Promise<void> {

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
        return this.genericTracker;
    }

    async getProcessResources(pid: number): Promise<{ cpu: number; mem: number }> {
        try {
            const { execSync } = require('child_process');
            // ps -p PID -o %cpu,rss
            // Output:
            // %CPU   RSS
            //  0.0  1234
            const output = execSync(`ps -p ${pid} -o %cpu,rss | tail -n 1`).toString().trim();
            const [cpuStr, memStr] = output.split(/\s+/);

            return {
                cpu: parseFloat(cpuStr) || 0,
                mem: (parseInt(memStr, 10) || 0) / 1024 // Convert KB to MB
            };
        } catch (e) {
            return { cpu: 0, mem: 0 };
        }
    }
}
