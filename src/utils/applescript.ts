import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Executes an AppleScript command and returns the result string.
 * Wraps local implementation using osascript.
 */
export async function runScript(script: string): Promise<string> {
    try {
        // Escape single quotes not strictly needed if we pipe, but for -e it is.
        // Better: use direct spawn or exec with maxBuffer if script is huge, 
        // but typically we pass the script as an argument or pipe it.
        // run-applescript usually executes `osascript -e ...`

        // We will pipe the script to osascript to avoid shell escaping issues with the script body.
        // But child_process.exec takes a command string. 
        // spawn is better for piping.

        // Let's use a simple spawn helper.

        return await runAppleScriptInternal(script);
    } catch (error: any) {
        if (error.message && error.message.includes('User canceled')) {
            return '';
        }
        throw error;
    }
}

import { spawn } from 'child_process';

function runAppleScriptInternal(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('osascript', ['-e', script]);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(`AppleScript failed (code ${code}): ${stderr}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
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
