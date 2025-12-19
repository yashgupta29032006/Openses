import { AppTracker, AppProcess, PlatformAdapter } from './interfaces';

export class PluginRegistry {
    private static instance: PluginRegistry;
    private trackers: AppTracker[] = [];
    private platform?: PlatformAdapter;

    private constructor() { }

    static getInstance(): PluginRegistry {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }

    setPlatform(platform: PlatformAdapter) {
        this.platform = platform;
    }

    getPlatform(): PlatformAdapter {
        if (!this.platform) {
            throw new Error("Platform not initialized");
        }
        return this.platform;
    }

    registerTracker(tracker: AppTracker) {
        this.trackers.push(tracker);
    }

    getTrackerFor(process: AppProcess): AppTracker | undefined {
        // Find specific tracker, or return nothing (generic tracker logic might be separate or applied if undefined)
        return this.trackers.find(t => t.matches(process));
    }

    getAllTrackers(): AppTracker[] {
        return this.trackers;
    }
}
