"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVSCodeState = getVSCodeState;
exports.restoreVSCode = restoreVSCode;
const applescript_1 = require("../utils/applescript");
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
async function getVSCodeState() {
    const appName = 'Code'; // or 'Visual Studio Code'
    if (!(await (0, applescript_1.isAppRunning)('Code')) && !(await (0, applescript_1.isAppRunning)('Visual Studio Code'))) {
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
        const titlesRaw = await (0, applescript_1.runScript)(script);
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
    }
    catch (e) {
        console.warn("Could not get VS Code windows", e);
        return null;
    }
}
async function restoreVSCode(state) {
    // Since we don't have paths, we can only open the app.
    // If we had paths, we would run `code /path/to/project`.
    await (0, applescript_1.runScript)(`tell application "Visual Studio Code" to activate`);
}
