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
        // Here we could try to connect to the extension first
        // If extension fails, call captureRaw (which might use AppleScript)
        // For now, we assume captureRaw handles the "Best Effort"
        return await this.captureRaw(process);
    }
    async restore(item) {
        // Validate payload
        if (!item.payload || !item.payload.windows) {
            console.warn(`Invalid payload for browser restore: ${item.name}`);
            return;
        }
        await this.restoreRaw(item.payload);
    }
}
exports.AbstractBrowserAdapter = AbstractBrowserAdapter;
