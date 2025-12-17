# YG (Session Hoarder)

YG is a macOS CLI tool that saves and restores your entire desktop session. It captures open apps, window positions, browser tabs (with scroll position!), and active projects (VS Code).

## Features
- **Browser State**: Saves open tabs and their exact scroll position for Chrome, Brave, and Safari.
- **Developer Focus**: Remembers your open VS Code, Cursor, or Zed projects.
- **Window Management**: Restores window positions and sizes.
- **Multiple Sessions**: Switch between "Work", "Side Project", or "Chill" modes easily.

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

## Permissions
YG requires **Accessibility** and **Automation** permissions to control your apps.
When you run it for the first time, macOS will prompt you to allow Terminal/Node to control Chrome/Finder/etc.
