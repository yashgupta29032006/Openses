import { AppTracker, AppProcess, SessionItem } from '../../core/interfaces';
import { BrowserSessionState } from '../../core/browser_bridge';

export abstract class AbstractBrowserAdapter implements AppTracker {
    abstract getName(): string;

    // Each adapter must define which process names it supports
    abstract supportedProcessNames(): string[];

    matches(process: AppProcess): boolean {
        return this.supportedProcessNames().includes(process.name);
    }

    canRestore(item: SessionItem): boolean {
        return this.supportedProcessNames().includes(item.name);
    }

    abstract captureRaw(process: AppProcess): Promise<BrowserSessionState>;
    abstract restoreRaw(state: BrowserSessionState): Promise<void>;

    async capture(process: AppProcess): Promise<any> {
        // Here we could try to connect to the extension first
        // If extension fails, call captureRaw (which might use AppleScript)

        // For now, we assume captureRaw handles the "Best Effort"
        return await this.captureRaw(process);
    }

    async restore(item: SessionItem): Promise<void> {
        // Validate payload
        if (!item.payload || !item.payload.windows) {
            console.warn(`Invalid payload for browser restore: ${item.name}`);
            return;
        }
        await this.restoreRaw(item.payload as BrowserSessionState);
    }
}
