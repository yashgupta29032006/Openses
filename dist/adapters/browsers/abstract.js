"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractBrowserAdapter = void 0;
class AbstractBrowserAdapter {
    matches(process) {
        return this.supportedProcessNames().includes(process.name);
    }
    canRestore(item) {
        return this.supportedProcessNames().includes(item.name);
    }
    async capture(process) {
        return await this.captureRaw(process);
    }
    async restore(item) {
        if (!item.payload || !item.payload.windows) {
            console.warn(`Invalid payload for browser restore: ${item.name}`);
            return;
        }
        await this.restoreRaw(item.payload);
    }
}
exports.AbstractBrowserAdapter = AbstractBrowserAdapter;
