import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { SessionData, SessionSummary } from './interfaces';

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

    async listSessionSummaries(): Promise<SessionSummary[]> {
        await this.init();
        const files = await fs.readdir(SESSION_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const summaries: SessionSummary[] = [];

        for (const file of jsonFiles) {
            try {
                const filePath = path.join(SESSION_DIR, file);
                const data: SessionData = await fs.readJson(filePath);
                const stats = await fs.stat(filePath);

                // Determine confidence
                const total = data.items.length;
                const highConf = data.items.filter(i => i.confidence === 'high' || i.trackerType === 'plugin').length;
                const mediumConf = data.items.filter(i => i.confidence === 'medium' || i.trackerType === 'universal').length;

                let confidence: 'Full' | 'Partial' | 'Layout-only' = 'Partial';
                if (total > 0) {
                    if (highConf / total > 0.8) confidence = 'Full';
                    else if (mediumConf === total) confidence = 'Layout-only';
                }

                summaries.push({
                    id: file.replace('.json', ''),
                    created: data.meta?.created || stats.birthtimeMs || stats.mtimeMs,
                    appCount: total,
                    confidence
                });
            } catch (e) {
                // Skip corrupted files
                console.warn(`Skipping corrupted session file: ${file}`);
            }
        }

        // Sort by created desc (newest first)
        return summaries.sort((a, b) => b.created - a.created);
    }

    async deleteSession(name: string): Promise<void> {
        const filePath = path.join(SESSION_DIR, `${name}.json`);
        await fs.remove(filePath);
    }
}
