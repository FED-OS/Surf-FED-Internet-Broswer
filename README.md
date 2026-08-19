# MyBrowser

A simple desktop web browser built with Electron. Has tabs, an address bar,
back/forward/reload, and loads real websites via `<webview>`.

## Run locally

```bash
npm install
npm start
```

## Package into an installable app

```bash
npm run dist
```

Output goes to the `dist/` folder (installer for your OS).

## File overview

- `main.js` — Electron main process, creates the app window
- `preload.js` — safe bridge between main process and the page
- `index.html` — browser UI shell (tab bar, toolbar, webview container)
- `renderer.js` — tab management and navigation logic
- `styles.css` — UI styling
- `package.json` — dependencies and build config
# Advanced Browser

A feature-rich custom browser built on Electron, packed with over 35 built-in features – no server, no cloud, all local.

## Features
- Dark/Light theme
- Tab management (new, close, duplicate, reorder)
- Bookmark and history
- Downloads list
- Search engine switcher
- Incognito windows
- Full keyboard shortcuts
- And much more!

## Build & Run
```bash
npm install
npm start
