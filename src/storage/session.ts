import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const SESSION_DIR = path.join(os.homedir(), '.yg', 'sessions');

export interface TabData {
    url: string;
    scrollRatio: number; // 0 to 1
}

export interface BrowserState {
    appName: string;
    windows: {
        tabs: TabData[];
        activeTabIndex: number;
        bounds: { x: number; y: number; w: number; h: number };
    }[];
}

export interface AppState {
    appName: string;
    windows: {
        title: string;
        bounds: { x: number; y: number; w: number; h: number };
    }[];
    // For VS Code mostly
    workspacePath?: string;
}

export interface SessionData {
    name: string;
    timestamp: number;
    browsers: BrowserState[];
    apps: AppState[];
}

export async function initStorage() {
    await fs.ensureDir(SESSION_DIR);
}

export async function saveSession(name: string, data: SessionData) {
    await initStorage();
    const filePath = path.join(SESSION_DIR, `${name}.json`);
    await fs.writeJson(filePath, data, { spaces: 2 });
}

export async function loadSession(name: string): Promise<SessionData | null> {
    const filePath = path.join(SESSION_DIR, `${name}.json`);
    if (!await fs.pathExists(filePath)) {
        return null;
    }
    return await fs.readJson(filePath);
}

export async function listSessions(): Promise<string[]> {
    await initStorage();
    const files = await fs.readdir(SESSION_DIR);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
}

export async function deleteSession(name: string) {
    const filePath = path.join(SESSION_DIR, `${name}.json`);
    await fs.remove(filePath);
}
