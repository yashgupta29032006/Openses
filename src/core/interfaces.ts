
export interface AppProcess {
    pid: number;
    name: string;
    path?: string; // Executable path
    bundleId?: string; // macOS bundle identifier
    title?: string;
    isActive?: boolean;
}

export type SessionItemType = 'app' | 'browser';

export interface SessionItem {
    type: SessionItemType;
    id: string; // bundleId or process name
    name: string; // Human readable name
    payload: any; // The state blob
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
}

export interface AppTracker {
    getName(): string;
    matches(process: AppProcess): boolean;
    canRestore(item: SessionItem): boolean;
    capture(process: AppProcess): Promise<any>;
    restore(item: SessionItem): Promise<void>;
}
