# YG (Session Hoarder)

YG is a **Universal Desktop Session Manager** for macOS.
It allows you to save and restore your entire working context (Window positions, Browser Tabs, Open Apps).

## Features
-   **Universal Tracking**: Automatically detects and tracks generic window positions for any scriptable macOS app.
-   **Browser Depth**: Specific adapters for **Chrome**, **Brave**, **Safari**, and **Edge** to save tabs and scroll positions.
-   **Plugin Architecture**: Easily extensible via the `AppTracker` interface.
-   **JSON Storage**: Sessions are saved as readable, normalized JSON files in `~/.yg/sessions`.

## Installation

You can download the standalone executable `yg-arm64` (located in the `build` folder).

After downloading it, run:
```bash
sudo mv ~/Downloads/yg-arm64 /usr/local/bin/yg
```

Then you can simply use `yg` from anywhere!

## Usage

### Save a Session
Save your current open apps and windows:
```bash
yg save <session-name>
# Example: yg save work-focus
```

### Restore a Session
Restore a previously saved session:
```bash
yg restore <session-name>
# Example: yg restore work-focus
```

### List Sessions
See all saved sessions:
```bash
yg list
```

### Delete a Session
Remove a saved session:
```bash
yg delete <session-name>
```

### Help
View all available commands:
```bash
yg --help
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
