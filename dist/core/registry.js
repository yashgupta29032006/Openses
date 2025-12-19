"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
class PluginRegistry {
    static instance;
    trackers = [];
    platform;
    constructor() { }
    static getInstance() {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }
    setPlatform(platform) {
        this.platform = platform;
    }
    getPlatform() {
        if (!this.platform) {
            throw new Error("Platform not initialized");
        }
        return this.platform;
    }
    registerTracker(tracker) {
        this.trackers.push(tracker);
    }
    getTrackerFor(process) {
        // Find specific tracker, or return nothing (generic tracker logic might be separate or applied if undefined)
        return this.trackers.find(t => t.matches(process));
    }
    getAllTrackers() {
        return this.trackers;
    }
}
exports.PluginRegistry = PluginRegistry;
