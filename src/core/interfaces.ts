
export interface AppProcess {
    pid: number;
    name: string;
    path?: string;
    bundleId?: string;
    title?: string;
    isActive?: boolean;
}

export type SessionItemType = 'app' | 'browser';

export interface SessionItem {
    type: SessionItemType;
    id: string;
    name: string;
    payload: any;
    confidence?: 'high' | 'medium' | 'low';
    trackerType?: 'plugin' | 'universal';
    metadata?: any;
}

export interface SessionData {
    meta: {
        version: number;
        created: number;
        os: string;
        hostname: string;
    };
    items: SessionItem[];
}

export interface PlatformAdapter {
    get currentOS(): string;
    listRunningApps(): Promise<AppProcess[]>;
    activateApp(pid: number): Promise<void>;
    openApp(path: string): Promise<void>;
    getAppTracker(process: AppProcess): AppTracker;
    getProcessResources?(pid: number): Promise<{ cpu: number; mem: number }>;
}

export interface AppTracker {
    getName(): string;
    matches(process: AppProcess): boolean;
    canRestore(item: SessionItem): boolean;
    capture(process: AppProcess): Promise<any>;
    restore(item: SessionItem): Promise<void>;
}

export interface SessionSummary {
    id: string; // filename without extension
    created: number;
    appCount: number;
    confidence: 'Full' | 'Partial' | 'Layout-only';
}
