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
    async listSessions() {
        await this.init();
        const files = await fs_extra_1.default.readdir(SESSION_DIR);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    }
    async deleteSession(name) {
        const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
        await fs_extra_1.default.remove(filePath);
    }
}
exports.StorageManager = StorageManager;
