"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAppleScript = runAppleScript;
exports.runJxa = runJxa;
const child_process_1 = require("child_process");
async function runAppleScript(script) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('osascript', ['-e', script]);
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
                // If user canceled, just return empty
                if (stderr.includes('User canceled')) {
                    resolve('');
                }
                else {
                    reject(new Error(`AppleScript failed (code ${code}): ${stderr}`));
                }
            }
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
async function runJxa(script) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('osascript', ['-l', 'JavaScript', '-e', script]);
        // ... similar to above but for JXA if needed
        // For now we stick to standard AppleScript as it's often more stable for "System Events"
        let stdout = '';
        child.stdout.on('data', d => stdout += d.toString());
        child.on('close', (code) => {
            if (code === 0)
                resolve(stdout.trim());
            else
                reject(new Error('JXA failed'));
        });
    });
}
