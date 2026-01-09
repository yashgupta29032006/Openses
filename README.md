# YG (Session Hoarder)

YG is a **Universal Desktop Session Manager** for macOS.
It allows you to save and restore your entire working context (Window positions, Browser Tabs, Open Apps).

## Features
-   **Universal Tracking**: Automatically detects and tracks generic window positions for any scriptable macOS app.
-   **Browser Depth**: Specific adapters for **Chrome**, **Brave**, **Safari**, and **Edge** to save tabs and scroll positions.
-   **Plugin Architecture**: Easily extensible via the `AppTracker` interface.
-   **JSON Storage**: Sessions are saved as readable, normalized JSON files in `~/.yg/sessions`.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repo_url>
    cd Openses
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the project**:
    ```bash
    npm run build
    ```

4.  **Link the CLI globally** (optional, for easy access):
    ```bash
    npm link
    ```
    *This allows you to run `yg` from any terminal window.*

## Usage

If you linked the package globally:

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

### Running without linking
If you didn't run `npm link`, you can use the CLI directly via node:
```bash
node dist/cli.js <command>
# Example: node dist/cli.js save my-session
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
