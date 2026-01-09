
export interface BrowserTab {
    url: string;
    title?: string;
    scrollRatio: number;
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


export type BrowserAction = 'capture' | 'restore';

export interface ExtensionRequest {
    type: BrowserAction;
    payload?: any;
}
