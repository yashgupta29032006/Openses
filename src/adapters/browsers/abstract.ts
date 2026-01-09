import { AppTracker, AppProcess, SessionItem } from '../../core/interfaces';
import { BrowserSessionState } from '../../core/browser_bridge';

export abstract class AbstractBrowserAdapter implements AppTracker {
    abstract getName(): string;


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



        return await this.captureRaw(process);
    }

    async restore(item: SessionItem): Promise<void> {

        if (!item.payload || !item.payload.windows) {
            console.warn(`Invalid payload for browser restore: ${item.name}`);
            return;
        }
        await this.restoreRaw(item.payload as BrowserSessionState);
    }
}
