import { AppState } from '../storage/session';
import { runScript, isAppRunning } from '../utils/applescript';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function getVSCodeState(): Promise<AppState | null> {
    const appName = 'Code'; // or 'Visual Studio Code'
    if (!(await isAppRunning('Code')) && !(await isAppRunning('Visual Studio Code'))) {
        return null;
    }

    // VS Code doesn't expose open workspace paths via AppleScript easily.
    // Method 1: Get Window Titles. Titles are usually "filename - projectname - Visual Studio Code"
    // Method 2: Use `lsof` or `ps`?
    // We'll use Window Titles for simplicity.

    const script = `
    tell application "System Events"
      tell process "Code"
         set t to name of windows
      end tell
    end tell
    return t
  `;

    // Note: This requires System Events access.
    // If we can't get it, we return empty.
    try {
        const titlesRaw = await runScript(script);
        const titles = titlesRaw.split(',').map(s => s.trim());

        // We store the titles, but we can't easily map back to PATH just from title 
        // unless we assume the User has `code` in PATH and we just re-open the "Folder Name"
        // actually recovering the full path from just the title is hard.
        // 
        // Alternative: Just restore the windows.
        // But prompt asks for "open projects".

        // For now, let's just save the titles in the metadata, 
        // and maybe in a real "production" app we'd need a VS Code extension to talk to the CLI.
        // 
        // Simpler hack: `lsof -a -p $(pgrep Code) | grep .vscode` ?

        return {
            appName: 'Code',
            windows: titles.map(t => ({ title: t, bounds: { x: 0, y: 0, w: 0, h: 0 } }))
        };
    } catch (e) {
        console.warn("Could not get VS Code windows", e);
        return null;
    }
}

export async function restoreVSCode(state: AppState) {
    // Since we don't have paths, we can only open the app.
    // If we had paths, we would run `code /path/to/project`.
    await runScript(`tell application "Visual Studio Code" to activate`);
}
