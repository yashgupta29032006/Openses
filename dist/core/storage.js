"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const SESSION_DIR = path_1.default.join(os_1.default.homedir(), '.yg', 'sessions');
class StorageManager {
    constructor() {
        this.init();
    }
    async init() {
        await fs_extra_1.default.ensureDir(SESSION_DIR);
    }
    async saveSession(name, session) {
        await this.init();
        const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
        await fs_extra_1.default.writeJson(filePath, session, { spaces: 2 });
    }
    async loadSession(name) {
        const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
        if (!await fs_extra_1.default.pathExists(filePath)) {
            return null;
        }
        return await fs_extra_1.default.readJson(filePath);
    }
    async listSessionSummaries() {
        await this.init();
        const files = await fs_extra_1.default.readdir(SESSION_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const summaries = [];
        for (const file of jsonFiles) {
            try {
                const filePath = path_1.default.join(SESSION_DIR, file);
                const data = await fs_extra_1.default.readJson(filePath);
                const stats = await fs_extra_1.default.stat(filePath);
                // Determine confidence
                const total = data.items.length;
                const highConf = data.items.filter(i => i.confidence === 'high' || i.trackerType === 'plugin').length;
                const mediumConf = data.items.filter(i => i.confidence === 'medium' || i.trackerType === 'universal').length;
                let confidence = 'Partial';
                if (total > 0) {
                    if (highConf / total > 0.8)
                        confidence = 'Full';
                    else if (mediumConf === total)
                        confidence = 'Layout-only';
                }
                summaries.push({
                    id: file.replace('.json', ''),
                    created: data.meta?.created || stats.birthtimeMs || stats.mtimeMs,
                    appCount: total,
                    confidence
                });
            }
            catch (e) {
                // Skip corrupted files
                console.warn(`Skipping corrupted session file: ${file}`);
            }
        }
        // Sort by created desc (newest first)
        return summaries.sort((a, b) => b.created - a.created);
    }
    async deleteSession(name) {
        const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
        await fs_extra_1.default.remove(filePath);
    }
}
exports.StorageManager = StorageManager;
