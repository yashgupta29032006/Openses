"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScript = runScript;
exports.isAppRunning = isAppRunning;
exports.activateApp = activateApp;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
/**
 * Executes an AppleScript command and returns the result string.
 * Wraps local implementation using osascript.
 */
async function runScript(script) {
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
    }
    catch (error) {
        if (error.message && error.message.includes('User canceled')) {
            return '';
        }
        throw error;
    }
}
const child_process_2 = require("child_process");
function runAppleScriptInternal(script) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_2.spawn)('osascript', ['-e', script]);
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
            }
            else {
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
