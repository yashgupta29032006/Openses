"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScript = runScript;
exports.isAppRunning = isAppRunning;
exports.activateApp = activateApp;
const run_applescript_1 = require("run-applescript");
/**
 * Executes an AppleScript command and returns the result string.
 * Wraps the run-applescript library.
 */
async function runScript(script) {
    try {
        return await (0, run_applescript_1.runAppleScript)(script);
    }
    catch (error) {
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
async function isAppRunning(appName) {
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
async function activateApp(appName) {
    await runScript(`tell application "${appName}" to activate`);
}
