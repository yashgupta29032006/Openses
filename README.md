# YG (Session Hoarder)

YG is a **Universal Desktop Session Manager** for macOS.
It allows you to save and restore your entire working context (Window positions, Browser Tabs, Open Apps).

## Features
-   **Universal Tracking**: Automatically detects and tracks generic window positions for any scriptable macOS app.
-   **Browser Depth**: Specific adapters for **Chrome**, **Brave**, **Safari**, and **Edge** to save tabs and scroll positions.
-   **Plugin Architecture**: Easily extensible via the `AppTracker` interface.
-   **JSON Storage**: Sessions are saved as readable, normalized JSON files in `~/.yg/sessions`.

## Installation

```bash
git clone <repo>
cd YG
npm install
npm run build
npm link
```

## Usage

### Save a Session
```bash
yg save work-morning
```

### Restore a Session
```bash
yg restore work-morning
```

### List Sessions
```bash
yg list
```

## Extending (Plugins)

The project is built on a plugin system.

### Adding a new App Tracker
Implement the `AppTracker` interface:
```typescript
class MyAppTracker implements AppTracker {
    matches(process: AppProcess) { return process.name === 'MyApp'; }
    async capture(process) { ... }
    async restore(item) { ... }
}
```
Register it in `src/cli.ts`.
