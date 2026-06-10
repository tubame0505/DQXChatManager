# Architecture

**Analysis Date:** 2026-04-29

## Pattern Overview

**Overall:** Electron shell with a preload bridge and a WebDriver-driven automation backend.

**Key Characteristics:**
- `src/main.ts` owns the Electron app lifecycle, IPC handlers, and window creation.
- `src/preload.ts` exposes a narrow `window.myAPI` bridge to the renderer through `contextBridge`.
- `src/web/App.tsx` is a React UI that sends commands and renders log/emote output returned from the main process.
- `src/dqx-hiroba.ts` coordinates login, export, and import flows using `src/services/webdriver-session.ts` and `src/services/emote-manager.ts`.

## Layers

**Electron Main Process:**
- Purpose: Create the app window, install IPC handlers, manage clipboard/context-menu behavior, and orchestrate login/import/export.
- Location: `src/main.ts`
- Contains: `BrowserWindow` setup, `ipcMain` handlers, `Menu` creation, clipboard access, `DriverDownloader` use.
- Depends on: `src/dqx-hiroba.ts`, `src/driver_downloader.ts`, `src/utils/logger.ts`, `src/security/security-validator.ts`.
- Used by: Electron runtime entry point from `dist/main.js`.

**Preload Bridge:**
- Purpose: Expose a limited renderer API without giving the UI direct Node access.
- Location: `src/preload.ts`
- Contains: `contextBridge.exposeInMainWorld("myAPI", ...)`.
- Depends on: `ipcRenderer`.
- Used by: `src/web/App.tsx` through `window.myAPI`.

**Renderer UI:**
- Purpose: Collect profile/emote text input and render status output.
- Location: `src/web/`
- Contains: `src/web/index.tsx`, `src/web/App.tsx`, `src/web/index.html`, `src/web/index.css`, `src/web/App.css`.
- Depends on: `window.myAPI` only; no direct Electron or filesystem access.
- Used by: Browser window loading `dist/index.html`.

**Automation and Domain Services:**
- Purpose: Encapsulate WebDriver session management, emote export/import logic, and per-emote-type editing behavior.
- Location: `src/services/`, `src/dqx-hiroba.ts`
- Contains: `WebDriverSession`, `EmoteManager`, `EmoteHandlerFactory`, `DialogueHandler`, `StampHandler`, `OthersHandler`.
- Depends on: `selenium-webdriver`, `selenium-webdriver/edge`, `src/config/app-config.ts`, `src/utils/webdriver-utils.ts`, `src/security/*`.
- Used by: `src/main.ts`.

**Security Helpers:**
- Purpose: Constrain path handling, registry access, and HTML/text normalization.
- Location: `src/security/`
- Contains: `PathValidator`, `RegistryValidator`, `SecureFileManager`, `ContentSanitizer`.
- Depends on: `path`, `fs`, and standard string/URL parsing.
- Used by: `src/dqx-hiroba.ts`, `src/driver_downloader.ts`, `src/services/emote-manager.ts`, `src/emote-data.ts`.

## Data Flow

**Login Flow:**

1. The renderer calls `window.myAPI.login(profile)` from `src/web/App.tsx`.
2. `src/preload.ts` forwards the command over IPC as `login`.
3. `src/main.ts` creates a `DriverDownloader`, reads the installed Edge version from the registry, and downloads or reuses the matching EdgeDriver under the app directory.
4. `src/dqx-hiroba.ts` validates the optional profile name with `PathValidator.createSecureProfilePath()` and creates `profiles/<profile>` under the app path when a profile is selected.
5. `src/services/webdriver-session.ts` creates the Edge WebDriver session with the profile directory and opens `APP_CONFIG.URLS.TARGET`.
6. Status messages flow back to the renderer through `webContents.send("send_message", "log", ...)`.

**Export Flow:**

1. The renderer calls `window.myAPI.export()`.
2. `src/main.ts` calls `DqxHiroba.exportEmote()`.
3. `src/dqx-hiroba.ts` checks that the WebDriver session exists and is not busy, then delegates to `EmoteManager.exportEmote()`.
4. `src/services/emote-manager.ts` iterates through `APP_CONFIG.EMOTE_PROCESSING.PAGES.TOTAL_PAGES`, opens each page bar if needed, reads the rows with XPath selectors, and serializes each row to tab-separated emote text.
5. Exported lines are appended to the renderer through `webContents.send("send_message", "emote", ...)`.

**Import Flow:**

1. The renderer calls `window.myAPI.import(emoteData)` with the text currently in the textarea.
2. `src/main.ts` forwards the string to `DqxHiroba.importEmote()`.
3. `src/dqx-hiroba.ts` verifies that the WebDriver session is initialized, the current URL starts with `APP_CONFIG.URLS.TARGET`, and the input is non-empty.
4. A confirmation dialog is shown with `dialog.showMessageBoxSync()`.
5. `src/services/emote-manager.ts` splits the text into settings lines, parses each line into `EmoteData`, and dispatches to a handler from `EmoteHandlerFactory`.
6. `DialogueHandler`, `StampHandler`, or `OthersHandler` fills the edit dialog and registers the change through WebDriver, then the service verifies the saved value against the expected normalized value.

## Key Abstractions

**`DqxHiroba`:**
- Purpose: High-level application coordinator for login, export, and import.
- Examples: `src/dqx-hiroba.ts`
- Pattern: Wraps session lifecycle, busy-state checks, user confirmation, and error translation.

**`WebDriverSession`:**
- Purpose: Owns the Selenium Edge session.
- Examples: `src/services/webdriver-session.ts`
- Pattern: Initialize, navigate, wait for page/dialog states, and dispose in one place.

**`EmoteManager`:**
- Purpose: Export/import orchestration for DQX emote preferences.
- Examples: `src/services/emote-manager.ts`
- Pattern: Page iteration for export, line-by-line processing for import, and result aggregation in `ProcessingResult`.

**`EmoteHandlerFactory` and handlers:**
- Purpose: Route emote-specific edit behavior by `EmoteType`.
- Examples: `src/services/emote-handlers.ts`
- Pattern: Strategy-style handlers for `セリフ`, `スタンプ`, `だいじなもの`, and `その他`.

**`EmoteData`:**
- Purpose: Parse, validate, normalize, and serialize one emote row.
- Examples: `src/emote-data.ts`
- Pattern: Tab-separated representation shared by the renderer textarea and the import pipeline.

## Entry Points

**Electron bootstrap:**
- Location: `src/main.ts`
- Triggers: Electron starts from `dist/main.js` via `package.json#main`.
- Responsibilities: Create the window, install IPC handlers, start the app, and load `dist/index.html`.

**Renderer bootstrap:**
- Location: `src/web/index.tsx`
- Triggers: Browser window loads `dist/index.html`.
- Responsibilities: Mount `<App />` into `#root`.

**Preload bootstrap:**
- Location: `src/preload.ts`
- Triggers: Browser window preload script from `path.join(__dirname, "preload.js")`.
- Responsibilities: Expose `window.myAPI`.

## Error Handling

**Strategy:** Domain errors are thrown in backend services, logged in the main process, and reduced to status messages for the renderer.

**Patterns:**
- `EmoteProcessingError`, `WebDriverError`, `PageLoadError`, `DialogOperationError`, and `EmoteValidationError` capture the failing operation and context.
- `src/main.ts` catches synchronous IPC failures, logs `SecurityError` separately, and wraps async IPC handlers with `logAsyncIpcError()`.

## Cross-Cutting Concerns

**Logging:** `src/utils/logger.ts` sends log lines to the renderer via `send_message` and mirrors them to the console.
**Validation:** `src/security/security-validator.ts`, `src/emote-data.ts`, and `src/security/content-sanitizer.ts` validate profile names, registry paths, and emote content.
**Authentication:** Not detected; login uses the local Edge profile and browser automation against DQX Hiroba.
**Security Boundaries:** `contextIsolation: true`, `nodeIntegration: false`, strict CSP in `src/web/index.html`, and safe filesystem/registry helpers limit renderer and automation access.

## Runtime Paths

- Development renderer output: `dist/index.html`
- Main process entry: `dist/main.js`
- Preload script entry: `dist/preload.js`
- Browser automation target: `https://hiroba.dqx.jp/sc/preference/emotemsg`
- EdgeDriver download source: `https://msedgedriver.microsoft.com/`

---

*Architecture analysis: 2026-04-29*
