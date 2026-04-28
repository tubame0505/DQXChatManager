# Codebase Structure

**Analysis Date:** 2026-04-29

## Directory Layout

```text
DQXChatManager/
├── src/               # Application source for Electron main, preload, renderer, services, security, and shared models
├── scripts/           # Small runtime/dev helpers such as file-wait utilities
├── media/             # Static assets used by the application
├── dist/              # Generated build output; not hand-edited
├── packages/          # Generated packaged apps; not hand-edited
├── .planning/         # Planning artifacts and codebase maps
├── node_modules/      # Installed dependencies
├── package.json       # Scripts, dependencies, and Electron entry metadata
├── webpack.config.mts  # Webpack targets for main, preload, and renderer bundles
└── tsconfig*.json     # TypeScript build configuration
```

## Directory Purposes

**`src/`:**
- Purpose: All application code.
- Contains: Electron entry points, React UI, WebDriver automation, security helpers, config, exceptions, shared types, and assets referenced by webpack.
- Key files: `src/main.ts`, `src/preload.ts`, `src/dqx-hiroba.ts`, `src/driver_downloader.ts`, `src/web/App.tsx`, `src/services/emote-manager.ts`.

**`src/web/`:**
- Purpose: Renderer entry and UI.
- Contains: React mount point, root component, HTML shell, and CSS.
- Key files: `src/web/index.tsx`, `src/web/App.tsx`, `src/web/index.html`, `src/web/index.css`, `src/web/App.css`.

**`src/services/`:**
- Purpose: WebDriver session and emote processing logic.
- Contains: Session orchestration and the emote edit strategies.
- Key files: `src/services/webdriver-session.ts`, `src/services/emote-manager.ts`, `src/services/emote-handlers.ts`.

**`src/security/`:**
- Purpose: Path, registry, file, and content safety helpers.
- Contains: Guard rails around filesystem and registry access.
- Key files: `src/security/security-validator.ts`, `src/security/secure-file-manager.ts`, `src/security/content-sanitizer.ts`.

**`src/utils/`:**
- Purpose: Shared automation and logging utilities.
- Contains: WebDriver helpers, XPath builders, logger adapters.
- Key files: `src/utils/webdriver-utils.ts`, `src/utils/xpath-selectors.ts`, `src/utils/logger.ts`.

**`src/config/`:**
- Purpose: Application constants and shared types.
- Contains: WebDriver timing, URLs, registry path, and emote-related types.
- Key files: `src/config/app-config.ts`.

**`src/exceptions/`:**
- Purpose: Typed error classes for automation and validation failures.
- Contains: Domain-specific `Error` subclasses.
- Key files: `src/exceptions/emote-processing-exceptions.ts`.

**`src/@types/`:**
- Purpose: Ambient type declarations used by the renderer and asset imports.
- Contains: `window.myAPI` typing and asset module declarations.
- Key files: `src/@types/context.d.ts`, `src/@types/resources.d.ts`.

**`scripts/`:**
- Purpose: Small helper scripts used by npm commands.
- Contains: File-wait helper for Electron startup.
- Key files: `scripts/wait-for-file.js`.

**`media/`:**
- Purpose: Static assets shipped with the app.
- Contains: Image and other bundled resources.
- Key files: Not detected from the current scan.

**`dist/`:**
- Purpose: Build output consumed by Electron at runtime.
- Contains: Compiled main/preload code and the renderer bundle plus generated HTML.
- Key files: `dist/main.js`, `dist/preload.js`, `dist/index.html`.
- Hand-editing: Do not edit.

**`packages/`:**
- Purpose: Packaged Windows application output from `electron-packager`.
- Contains: Built distributable app folders.
- Key files: Not applicable.
- Hand-editing: Do not edit.

**`.planning/`:**
- Purpose: Planning and codebase mapping artifacts.
- Contains: Roadmaps, phase docs, and codebase analysis files.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `src/main.ts`: Electron app bootstrap and IPC server.
- `src/preload.ts`: Preload bridge that exposes `window.myAPI`.
- `src/web/index.tsx`: React renderer bootstrap.
- `src/web/index.html`: Renderer HTML shell loaded from `dist/index.html`.

**Configuration:**
- `package.json`: NPM scripts, dependencies, and `main: dist/main.js`.
- `webpack.config.mts`: Build targets for main, preload, and renderer bundles.
- `tsconfig.json`: Shared TypeScript settings.
- `tsconfig.main.json`: Main-process build output to `dist/`.
- `src/config/app-config.ts`: Runtime constants.

**Core Logic:**
- `src/dqx-hiroba.ts`: High-level login/export/import coordinator.
- `src/driver_downloader.ts`: Edge version detection and EdgeDriver download/install.
- `src/services/webdriver-session.ts`: Selenium Edge session lifecycle.
- `src/services/emote-manager.ts`: Export/import orchestration.
- `src/services/emote-handlers.ts`: Emote-type-specific dialog editing.
- `src/emote-data.ts`: Serialization and validation for emote rows.

**Testing:**
- Not detected.

## Naming Conventions

**Files:**
- Existing multi-word source files use kebab-case, such as `webdriver-session.ts`, `secure-file-manager.ts`, and `emote-processing-exceptions.ts`.

**Directories:**
- Feature grouping is by responsibility, such as `services`, `security`, `utils`, `web`, and `config`.

## Where to Add New Code

**New Feature:**
- Primary code: `src/services/` for WebDriver/automation behavior, or `src/web/` for renderer UI.
- Tests: Co-locate near the module as `*.test.ts` or `*.test.tsx` if tests are added.

**New Component/Module:**
- Implementation: `src/web/` for UI components or `src/utils/` for shared helpers.

**Utilities:**
- Shared helpers: `src/utils/`

**Security-sensitive changes:**
- Use `src/security/` and preserve the existing `contextIsolation` / `nodeIntegration` settings in `src/main.ts`.

## Special Directories

**`dist/`:**
- Purpose: Runtime build artifacts for Electron.
- Generated: Yes
- Committed: No

**`packages/`:**
- Purpose: Packaged app output.
- Generated: Yes
- Committed: No

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes
- Committed: No

**`media/`:**
- Purpose: Static assets bundled into the app.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-29*
