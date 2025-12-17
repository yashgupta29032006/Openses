import { AppState } from '../storage/session';
import { runScript, isAppRunning } from '../utils/applescript';

export async function getFinderState(): Promise<AppState | null> {
    const appName = 'Finder';
    if (!(await isAppRunning(appName))) return null;

    // Get open Finder windows and their targets (folders)
    const script = `
    tell application "Finder"
      set output to ""
      repeat with w in windows
        set targetPath to POSIX path of (target of w as alias)
        set b to bounds of w
        -- format: path|x,y,w,h;;
        set output to output & targetPath & "|" & (b as string) & ";;"
      end repeat
    end tell
    return output
  `;

    try {
        const raw = await runScript(script);
        const windows = raw.split(';;').filter(Boolean).map(line => {
            const [pathStr, boundsStr] = line.split('|');
            const coords = boundsStr.replace(/\s/g, '').split(',').map(Number);
            // Finder bounds: L, T, R, B
            return {
                title: pathStr, // Storing path in title for Finder
                bounds: { x: coords[0], y: coords[1], w: coords[2] - coords[0], h: coords[3] - coords[1] }
            };
        });

        return {
            appName: 'Finder',
            windows
        };
    } catch (e) {
        return { appName: 'Finder', windows: [] };
    }
}

export async function restoreFinder(state: AppState) {
    // Activate Finder
    // Close existing windows? Maybe not, just open the saved ones.

    for (const win of state.windows) {
        const folderPath = win.title;
        // Open folder
        await runScript(`tell application "Finder" to make new Finder window to (POSIX file "${folderPath}")`);

        // Set bounds
        const L = win.bounds.x;
        const T = win.bounds.y;
        const R = L + win.bounds.w;
        const B = T + win.bounds.h;

        // Setting bounds of the distinct front most window can be tricky if we iterate fast.
        // We assume the new window is window 1.
        await runScript(`tell application "Finder" to set bounds of window 1 to {${L}, ${T}, ${R}, ${B}}`);
    }
}
