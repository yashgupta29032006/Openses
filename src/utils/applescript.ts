import { runAppleScript } from 'run-applescript';

/**
 * Executes an AppleScript command and returns the result string.
 * Wraps the run-applescript library.
 */
export async function runScript(script: string): Promise<string> {
    try {
        return await runAppleScript(script);
    } catch (error: any) {
        if (error.message.includes('User canceled')) {
            return '';
        }
        // Log error but generally return empty or throw depending on criticality
        // console.error("AppleScript Error:", error.message);
        throw error;
    }
}

/**
 * Checks if an application is currently running.
 */
export async function isAppRunning(appName: string): Promise<boolean> {
    const script = `
    tell application "System Events"
      return (name of processes) contains "${appName}"
    end tell
  `;
    const result = await runScript(script);
    return result === 'true';
}

/**
 * Safely activates an app.
 */
export async function activateApp(appName: string): Promise<void> {
    await runScript(`tell application "${appName}" to activate`);
}
