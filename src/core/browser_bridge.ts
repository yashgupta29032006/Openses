// Defines the schema for messages between the backend and browser extensions
export interface BrowserTab {
    url: string;
    title?: string;
    scrollRatio: number; // 0 to 1
    isActive: boolean;
    favIconUrl?: string;
}

export interface BrowserWindow {
    id?: number;
    tabs: BrowserTab[];
    activeTabIndex: number;
    bounds?: { x: number; y: number; w: number; h: number };
}

export interface BrowserSessionState {
    windows: BrowserWindow[];
}

// Message types
export type BrowserAction = 'capture' | 'restore';

export interface ExtensionRequest {
    type: BrowserAction;
    payload?: any;
}
