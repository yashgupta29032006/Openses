"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelevanceEngine = void 0;
class RelevanceEngine {
    static MIN_MEMORY_MB = 50; // Filter out tiny helpers
    static MIN_CPU_PERCENT = 0.1;
    static shouldExclude(app) {
        if (!app.bundleId)
            return true; // No bundle ID = probably not a user app
        const ignoredPrefixes = [
            'com.apple.system.',
            'com.apple.coreservices.',
            'com.apple.usernoted',
            'com.apple.controlcenter',
            'com.apple.dock',
            'com.apple.loginwindow',
            'com.apple.Spotlight',
            'com.apple.PowerChime',
            'com.apple.notificationcenterui'
        ];
        // Explicit strict check
        if (ignoredPrefixes.some(p => app.bundleId.startsWith(p))) {
            return true;
        }
        // Also exclude if it looks like a helper tool inside another app (simplistic check)
        // e.g. "com.google.Chrome.helper" - actually we might want these if they show as apps, 
        // but usually lsappinfo only shows the main app. 
        // Let's stick to the prefix list for now to be safe and INCLUSIVE.
        return false;
    }
    static calculateScore(app, signal) {
        // ... (rest of the scoring logic remains for metadata)
        // 1. Critical: Visible Windows = Automatic Include
        if (signal.hasWindows)
            return 1.0;
        // 2. Critical: Frontmost = Automatic Include
        if (signal.isFrontmost)
            return 1.0;
        // 3. Heuristics
        let score = 0;
        // Memory Usage signal
        if (signal.memUsageMB && signal.memUsageMB > RelevanceEngine.MIN_MEMORY_MB) {
            score += 0.4;
        }
        // CPU Usage signal
        if (signal.cpuPercent && signal.cpuPercent > RelevanceEngine.MIN_CPU_PERCENT) {
            score += 0.3;
        }
        // Base score for simply being a regular app
        score += 0.1;
        return Math.min(score, 1.0);
    }
}
exports.RelevanceEngine = RelevanceEngine;
