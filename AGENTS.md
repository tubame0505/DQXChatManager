# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code. Electron entry points live in `src/main.ts` and `src/preload.ts`, the React renderer lives under `src/web/`, and shared logic is grouped in `src/services/`, `src/utils/`, `src/security/`, `src/config/`, and `src/exceptions/`. Type declarations live in `src/@types/`.

`scripts/` holds small development helpers such as `scripts/wait-for-file.js`. `media/` stores static assets. `dist/` and `packages/` are generated outputs; do not edit them by hand.

## Build, Test, and Development Commands
Install dependencies with `npm install`.

- `npm run dev`: starts the TypeScript watcher, webpack, and Electron for local development.
- `npm run compile`: compiles the Electron main process and builds the renderer in development mode without watch.
- `npm run build`: creates a production `dist/` bundle and copies required `regedit` VBS files.
- `npm run buildwin`: packages the Windows app into `packages/`.

Before opening a PR, run `npm run compile` and `npm run build` to catch type and bundling regressions.

## Coding Style & Naming Conventions
This repo uses TypeScript, React, ESLint, and Prettier. Prettier is configured for 4-space indentation, semicolons, double quotes, and trailing commas where valid in ES5.

Use `PascalCase` for classes and React components, `camelCase` for functions and variables, and `kebab-case` for multi-word file names where the repo already follows that pattern (for example `app-config.ts`, `webdriver-session.ts`). Keep security-sensitive defaults intact, especially Electron `contextIsolation` and disabled `nodeIntegration`.

Useful checks:

- `npx eslint src --ext .ts,.tsx`
- `npx prettier --check "src/**/*.{ts,tsx,css}"`

## Testing Guidelines
There is no dedicated automated test suite yet. Validate changes with:

- `npm run compile`
- `npm run build`
- manual smoke testing in `npm run dev`, especially login, import/export, and WebDriver-related flows

If you add tests, prefer colocated `*.test.ts` or `*.test.tsx` files near the module they cover.

## Commit & Pull Request Guidelines
Recent history follows a lightweight Conventional Commits style, for example `fix(webdriver-utils): ...` and `chore: ...`. Use `type(scope): summary` when a scope is clear.

PRs should include a short description, linked issue if applicable, manual verification steps, and screenshots for renderer UI changes. Call out any changes to Electron security settings, filesystem access, or WebDriver behavior explicitly.
