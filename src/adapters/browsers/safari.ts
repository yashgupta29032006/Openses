import { AbstractBrowserAdapter } from './abstract';
import { AppProcess, SessionItem } from '../../core/interfaces';
import { BrowserSessionState, BrowserWindow, BrowserTab } from '../../core/browser_bridge';
import { runAppleScript } from '../../platforms/macos/applescript';

export class SafariAdapter extends AbstractBrowserAdapter {
    getName(): string {
        return 'SafariAdapter';
    }

    supportedProcessNames(): string[] {
        return ['Safari'];
    }

    async captureRaw(process: AppProcess): Promise<BrowserSessionState> {
        const appName = 'Safari';
        // Safari script
        const script = `
        set output to ""
        tell application "Safari"
            repeat with w in windows
                set output to output & "WINDOW_START|" & (id of w) & "|" & (bounds of w as string) & "||"
                set currentTab to current tab of w
                repeat with t in tabs of w
                    set isCurrent to (t is equal to currentTab)
                    set tUrl to URL of t
                    set scrollY to "0"
                    set output to output & tUrl & "::" & scrollY & "::" & isCurrent & ";;"
                end repeat
                set output to output & "WINDOW_END" & "***"
            end repeat
        end tell
        return output
        `;

        try {
            const raw = await runAppleScript(script);
            return this.parseSafariOutput(raw);
        } catch (e) {
            return { windows: [] };
        }
    }

    private parseSafariOutput(raw: string): BrowserSessionState {
        // Similar parsing to Chrome but Safari bounds etc might be slightly different?
        // Actually we unified the output format in AS.
        const windows: BrowserWindow[] = [];
        const blocks = raw.split('***').filter(Boolean);

        for (const block of blocks) {
            const [header, body] = block.split('||');
            if (!body) continue;

            const headerParts = header.split('|');
            const boundsStr = headerParts[2];
            const coords = boundsStr.replace(/\s/g, '').split(',').map(Number);
            const bounds = { x: coords[0], y: coords[1], w: coords[2] - coords[0], h: coords[3] - coords[1] };

            const cleanBody = body.replace('WINDOW_END', '');
            const tabStrings = cleanBody.split(';;').filter(Boolean);

            const tabs: BrowserTab[] = [];
            let activeTabIndex = 0;

            tabStrings.forEach((ts, idx) => {
                const [url, scroll, isCurrent] = ts.split('::');
                if (url && url !== 'missing value') {
                    tabs.push({
                        url,
                        scrollRatio: 0, // Safari scrolling hard to read reliably without enabled JS
                        isActive: isCurrent === 'true'
                    });
                    if (isCurrent === 'true') activeTabIndex = idx;
                }
            });

            if (tabs.length > 0) {
                windows.push({ tabs, activeTabIndex, bounds });
            }
        }
        return { windows };
    }

    async restoreRaw(state: BrowserSessionState): Promise<void> {
        throw new Error("Use restore()");
    }

    async restore(item: SessionItem): Promise<void> {
        const appName = 'Safari';
        const state = item.payload as BrowserSessionState;

        await runAppleScript(`tell application "Safari" to activate`);

        for (const win of state.windows) {
            let isFirst = true;
            for (const tab of win.tabs) {
                if (isFirst) {
                    await runAppleScript(`tell application "Safari" to make new document with properties {URL:"${tab.url}"}`);
                    isFirst = false;
                } else {
                    await runAppleScript(`tell application "Safari" to make new tab at end of tabs of window 1 with properties {URL:"${tab.url}"}`);
                }
            }
        }
    }
}
