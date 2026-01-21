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
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'order.json');

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
                    confidence,
                    previewItems: data.items.map(i => ({ name: i.name || i.id, type: i.type }))
                });
            } catch (e) {
                // Skip corrupted files
                console.warn(`Skipping corrupted session file: ${file}`);
            }
        }

        // Load order
        const orderPath = path.join(SESSION_DIR, 'order.json');
        let order: string[] = [];
        if (await fs.pathExists(orderPath)) {
            try {
                order = await fs.readJson(orderPath);
            } catch (e) {
                console.warn('Failed to read order.json', e);
            }
        }

        // Sort based on order
        if (order.length > 0) {
            return summaries.sort((a, b) => {
                const idxA = order.indexOf(a.id);
                const idxB = order.indexOf(b.id);

                // If both present, sort by index
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;

                // If one present, it comes first? Or maybe new ones go top?
                // Visual Constraints: "Order is updated immediately" -> usually implies manual sort overrides.
                // Standard behavior: New items (not in order) go to TOP or BOTTOM. 
                // Let's put new items at the TOP so user sees them.
                if (idxA === -1 && idxB !== -1) return -1; // A is new, A comes first
                if (idxA !== -1 && idxB === -1) return 1;  // B is new, B comes first

                // Both new: sort by created desc
                return b.created - a.created;
            });
        }

        // Default: Sort by created desc (newest first)
        return summaries.sort((a, b) => b.created - a.created);
    }

    async saveSessionOrder(order: string[]): Promise<void> {
        await this.init();
        const filePath = path.join(SESSION_DIR, 'order.json');
        await fs.writeJson(filePath, order, { spaces: 2 });
    }

    async deleteSession(name: string): Promise<void> {
        const filePath = path.join(SESSION_DIR, `${name}.json`);
        await fs.remove(filePath);
    }
}
