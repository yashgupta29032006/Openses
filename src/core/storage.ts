import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { SessionData } from './interfaces';

const SESSION_DIR = path.join(os.homedir(), '.yg', 'sessions');

export class StorageManager {
    constructor() {
        this.init();
    }

    private async init() {
        await fs.ensureDir(SESSION_DIR);
    }

    async saveSession(name: string, session: SessionData): Promise<void> {
        await this.init();
        const filePath = path.join(SESSION_DIR, `${name}.json`);
        await fs.writeJson(filePath, session, { spaces: 2 });
    }

    async loadSession(name: string): Promise<SessionData | null> {
        const filePath = path.join(SESSION_DIR, `${name}.json`);
        if (!await fs.pathExists(filePath)) {
            return null;
        }
        return await fs.readJson(filePath);
    }

    async listSessions(): Promise<string[]> {
        await this.init();
        const files = await fs.readdir(SESSION_DIR);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    }

    async deleteSession(name: string): Promise<void> {
        const filePath = path.join(SESSION_DIR, `${name}.json`);
        await fs.remove(filePath);
    }
}
