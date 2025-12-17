"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStorage = initStorage;
exports.saveSession = saveSession;
exports.loadSession = loadSession;
exports.listSessions = listSessions;
exports.deleteSession = deleteSession;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const SESSION_DIR = path_1.default.join(os_1.default.homedir(), '.yg', 'sessions');
async function initStorage() {
    await fs_extra_1.default.ensureDir(SESSION_DIR);
}
async function saveSession(name, data) {
    await initStorage();
    const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
    await fs_extra_1.default.writeJson(filePath, data, { spaces: 2 });
}
async function loadSession(name) {
    const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
    if (!await fs_extra_1.default.pathExists(filePath)) {
        return null;
    }
    return await fs_extra_1.default.readJson(filePath);
}
async function listSessions() {
    await initStorage();
    const files = await fs_extra_1.default.readdir(SESSION_DIR);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
}
async function deleteSession(name) {
    const filePath = path_1.default.join(SESSION_DIR, `${name}.json`);
    await fs_extra_1.default.remove(filePath);
}
