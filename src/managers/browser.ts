import { BrowserState } from '../storage/session';
import { runScript, isAppRunning } from '../utils/applescript';

const SUPPORTED_BROWSERS = ['Google Chrome', 'Brave Browser', 'Safari'];

export async function getBrowserState(appName: string): Promise<BrowserState | null> {
    if (!(await isAppRunning(appName))) return null;

    // Different script for Safari vs Chromium
    const isSafari = appName === 'Safari';

    // AppleScript to get windows and tabs
    // We use reliable basic properties: URL, Title.
    // Scroll position is tricky - we try to inject JS.
    // Note: 'execute javascript' works on Chrome 'tab' objects. Safari uses 'do JavaScript' on 'tab'.

    let script = '';

    if (isSafari) {
        script = `
      set output to ""
      tell application "${appName}"
        repeat with w in windows
          -- Helper to build JSON-like string manually to avoid heavy parsing issues in AppleScript
          set output to output & "WINDOW_START|" & (id of w) & "|" & (bounds of w as string) & "||"
          
          set currentTab to current tab of w
          repeat with t in tabs of w
            set isCurrent to (t is equal to currentTab)
            set tUrl to URL of t
            -- Try to get scroll (only reliable-ish on current tab without activating)
            -- We skip scroll for now to ensure speed, unless it's the active tab
            set scrollY to "0"
            -- if isCurrent then
            --   try
            --      set scrollY to do JavaScript "window.scrollY / document.body.scrollHeight" in t
            --   end try
            -- end if
            
            set output to output & tUrl & "::" & scrollY & "::" & isCurrent & ";;"
          end repeat
          set output to output & "WINDOW_END" & "***"
        end repeat
      end tell
      return output
    `;
    } else {
        // Chromium (Chrome, Brave, Arc)
        script = `
      set output to ""
      tell application "${appName}"
        repeat with w in windows
          set output to output & "WINDOW_START|" & (id of w) & "|" & (bounds of w as string) & "||"
          set activeId to id of active tab of w
          repeat with t in tabs of w
             set tUrl to URL of t
             set tId to id of t
             set isCurrent to (tId = activeId)
             
             -- Chromium execute JS
             set scrollY to "0"
             if isCurrent then
               try
                 set scrollY to execute t javascript "window.scrollY / document.body.scrollHeight"
               end try
             end if

             set output to output & tUrl & "::" & scrollY & "::" & isCurrent & ";;"
          end repeat
          set output to output & "WINDOW_END" & "***"
        end repeat
      end tell
      return output
    `;
    }

    const raw = await runScript(script);
    return parseBrowserRaw(appName, raw);
}

function parseBrowserRaw(appName: string, raw: string): BrowserState {
    // Format: WINDOW_START|id|bounds||url::scroll::isCurrent;;url::...;;WINDOW_END***...
    const windows: BrowserState['windows'] = [];

    const windowBlocks = raw.split('***').filter(Boolean);

    for (const block of windowBlocks) {
        const parts = block.split('||');
        const header = parts[0]; // WINDOW_START|id|bounds
        const body = parts[1]; // url::scroll::isCurrent;;... WINDOW_END

        const headerParts = header.split('|');
        const boundsStr = headerParts[2]; // "x, y, w, h" (AppleScript usually returns x, y, x2, y2 or x,y,w,h depending on app version, usually x,y,w,h for bounds)
        // Actually AppleScript 'bounds' is Left, Top, Right, Bottom.

        // Parse bounds
        const coords = boundsStr.replace(/\s/g, '').split(',').map(Number);
        // x, y, x2, y2 -> x, y, w, h
        const bounds = { x: coords[0], y: coords[1], w: coords[2] - coords[0], h: coords[3] - coords[1] };

        const cleanBody = body.replace('WINDOW_END', '');
        const tabStrings = cleanBody.split(';;').filter(Boolean);

        const tabs = [];
        let activeTabIndex = 0;

        for (let i = 0; i < tabStrings.length; i++) {
            const [url, scroll, isCurrentStr] = tabStrings[i].split('::');
            if (url && url !== 'missing value') {
                tabs.push({
                    url,
                    scrollRatio: parseFloat(scroll) || 0
                });
                if (isCurrentStr === 'true') {
                    activeTabIndex = i;
                }
            }
        }

        if (tabs.length > 0) {
            windows.push({ tabs, activeTabIndex, bounds });
        }
    }

    return { appName, windows };
}

export async function restoreBrowser(state: BrowserState) {
    const { appName, windows } = state;
    // Activate app first
    await runScript(`tell application "${appName}" to activate`);

    for (const win of windows) {
        // Create new window
        // First tab creation implies window creation usually.
        // If it's Chrome: 'make new window'

        let isFirstTab = true;
        for (let i = 0; i < win.tabs.length; i++) {
            const tab = win.tabs[i];
            if (appName === 'Safari') {
                if (isFirstTab) {
                    // Creating a window in Safari is tricky via automation in one go, 
                    // usually 'make new document' works.
                    await runScript(`tell application "${appName}" to make new document with properties {URL:"${tab.url}"}`);
                    isFirstTab = false;
                } else {
                    await runScript(`tell application "${appName}" to make new tab at end of tabs of window 1 with properties {URL:"${tab.url}"}`);
                }
                // Restore scroll if needed (delay might be needed for load)
            } else {
                // Chrome
                if (isFirstTab) {
                    await runScript(`tell application "${appName}" to make new window`);
                    // First tab usually empty, set its URL
                    await runScript(`tell application "${appName}" to set URL of active tab of window 1 to "${tab.url}"`);
                    isFirstTab = false;
                } else {
                    await runScript(`tell application "${appName}" to make new tab at end of tabs of window 1 with properties {URL:"${tab.url}"}`);
                }
            }
        }

        // Set Bounds
        // AppleScript bounds are L, T, R, B
        const L = win.bounds.x;
        const T = win.bounds.y;
        const R = L + win.bounds.w;
        const B = T + win.bounds.h;

        // Attempt to set bounds
        try {
            await runScript(`tell application "${appName}" to set bounds of window 1 to {${L}, ${T}, ${R}, ${B}}`);
        } catch (e) { }
    }
}
