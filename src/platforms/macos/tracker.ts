import { AppTracker, AppProcess, SessionItem } from '../../core/interfaces';
import { runAppleScript } from './applescript';

export class AppleScriptAppTracker implements AppTracker {
    getName(): string {
        return 'GenericAppleScriptTracker';
    }

    matches(process: AppProcess): boolean {
        // This is the fallback tracker, so it matches everything not handled by specific ones.
        return true;
    }

    canRestore(item: SessionItem): boolean {
        return true;
    }

    async capture(process: AppProcess): Promise<any> {
        const appName = process.name;
        // Basic window capture
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

        let windows: { title: string; bounds: { x: number; y: number; w: number; h: number; }; }[] = [];
        try {
            const raw = await runAppleScript(script);
            if (raw) {
                windows = raw.split(';;').filter(Boolean).map(line => {
                    const parts = line.split('|');
                    const title = parts[0];
                    const boundsStr = parts[1] || "";

                    const coords = boundsStr.replace(/\s/g, '').split(',').map(Number);
                    let bounds = { x: 0, y: 0, w: 0, h: 0 };

                    if (coords.length >= 4) {
                        // AppleScript bounds are L, T, R, B
                        bounds = {
                            x: coords[0],
                            y: coords[1],
                            w: coords[2] - coords[0],
                            h: coords[3] - coords[1]
                        };
                    }
                    return { title, bounds };
                }).filter(Boolean);
            }
        } catch (e) {
            // Ignore failure here, try document capture below
        }

        // Try to capture open document/file path
        let openFile = undefined;
        try {
            // Some apps expose 'document 1' -> 'file' -> 'posix path'
            // Or 'file of document 1'
            const docScript = `tell application "${appName}" to get POSIX path of (file of document 1)`;
            const docPath = await runAppleScript(docScript);
            if (docPath && !docPath.includes('error') && docPath.trim() !== '') {
                openFile = docPath.trim();
            }
        } catch { }

        // If we found nothing, but process is running, return empty object so it IS tracked
        // This ensures "Notion" is at least opened next time even if we can't get windows
        return { windows, openFile };
    }

    async restore(item: SessionItem): Promise<void> {
        const appName = item.name;
        const windows = item.payload.windows || [];
        const openFile = item.payload.openFile;

        // Activate
        await runAppleScript(`tell application "${appName}" to activate`);

        // If we saved an open file, try to open it
        if (openFile) {
            try {
                await runAppleScript(`tell application "${appName}" to open (POSIX file "${openFile}")`);
            } catch (e) {
                console.warn(`Failed to open file ${openFile} in ${appName}`);
            }
        }

        // Restore Windows Bounds
        let i = 1;
        for (const win of windows) {
            const { x, y, w, h } = win.bounds;
            if (w === 0 && h === 0) continue;

            const R = x + w;
            const B = y + h;
            try {
                await runAppleScript(`tell application "${appName}" to set bounds of window ${i} to {${x}, ${y}, ${R}, ${B}}`);
                i++;
            } catch (e) {
                // ignore
            }
        }
    }
}
