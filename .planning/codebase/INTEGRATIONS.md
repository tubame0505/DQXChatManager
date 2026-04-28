# External Integrations

**Analysis Date:** 2026-04-29

## APIs & External Services

**Electron platform APIs:**
- `BrowserWindow`, `app`, `ipcMain`, `clipboard`, and `Menu` are used in `src/main.ts`
- `contextBridge` and `ipcRenderer` are used in `src/preload.ts`
- IPC channels exposed through `src/preload.ts` and consumed in `src/web/App.tsx` include `login`, `export`, `import`, `show-context-menu`, `clipboard-cut`, `clipboard-copy`, `clipboard-paste`, `text-delete`, and `text-select-all`
- Renderer-to-main message relay uses `send_message` from `src/main.ts` and `src/utils/logger.ts`

**DQX Hiroba web app:**
- Target URL: `https://hiroba.dqx.jp/sc/preference/emotemsg`
- Defined in `src/config/app-config.ts` as `APP_CONFIG.URLS.TARGET`
- Opened by `src/services/webdriver-session.ts` and validated by `src/dqx-hiroba.ts` and `src/services/emote-manager.ts`
- The automation logic in `src/utils/webdriver-utils.ts`, `src/services/emote-manager.ts`, and `src/services/emote-handlers.ts` is built around the current page DOM and XPath selectors in `src/utils/xpath-selectors.ts`

**Microsoft EdgeDriver CDN:**
- Download base URL: `https://msedgedriver.microsoft.com/`
- Used by `src/driver_downloader.ts` to fetch `edgedriver_win64.zip`
- Driver ZIPs are unpacked into `dist/win64/<EdgeVersion>/`

**Microsoft Edge browser discovery:**
- Registry path: `HKLM\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe`
- The allowed registry path is enforced by `RegistryValidator` in `src/security/security-validator.ts`
- `src/driver_downloader.ts` reads the registry entry with `regedit`
- The Edge executable version is read by invoking `powershell` with `(Get-Item "<path>").VersionInfo.ProductVersion`

## Data Storage

**Databases:**
- Not detected

**File Storage:**
- Local filesystem only
- User profile directories are created under `__dirname/profiles/<profile>` by `PathValidator.createSecureProfilePath()` in `src/security/security-validator.ts`
- EdgeDriver binaries are stored under `__dirname/win64/<version>/msedgedriver.exe` by `src/driver_downloader.ts`
- Temporary ZIP files are written alongside the driver directory and deleted after extraction
- `src/security/secure-file-manager.ts` restricts reads, writes, deletes, and cleanup to an allowed base path

**Caching:**
- Not detected

## Authentication & Identity

**Auth Provider:**
- Custom browser-session flow rather than a separate identity provider
- Login is performed by launching Microsoft Edge through Selenium in `src/services/webdriver-session.ts`
- Optional profile selection in `src/web/App.tsx` maps to secure browser profile directories in `src/dqx-hiroba.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected
- Errors are logged through `src/utils/logger.ts` to `console.*` and to the renderer via `send_message`

**Logs:**
- `src/utils/logger.ts` sends UI log text to the renderer and writes to the Node console
- `src/main.ts` centralizes IPC error reporting with `logAsyncIpcError()`

## CI/CD & Deployment

**Hosting:**
- Electron desktop app packaged for Windows
- `npm run buildwin` uses `electron-packager` to create `packages/DQXChatManager-win32-x64/`

**CI Pipeline:**
- GitHub Actions build workflow is referenced in `README.md` by the build badge

## Environment Configuration

**Required env vars:**
- `NODE_ENV` - switches webpack mode and dev-time Electron behavior
- `NO_WATCH` - disables webpack watch mode when set to `true`

**Secrets location:**
- Not detected

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Browser traffic to `https://hiroba.dqx.jp/sc/preference/emotemsg`
- Driver download traffic to `https://msedgedriver.microsoft.com/`

## Electron IPC Surface

**Main-process handlers:**
- `login` in `src/main.ts` starts EdgeDriver download/launch and invokes `DqxHiroba.login()`
- `export` and `import` invoke emote export/import flows in `src/dqx-hiroba.ts`
- `show-context-menu` builds a native `Menu` from renderer state
- `clipboard-cut`, `clipboard-copy`, `clipboard-paste`, `text-delete`, and `text-select-all` bridge renderer editing actions to Electron clipboard and menu actions

**Preload bridge:**
- `src/preload.ts` exposes these methods as `window.myAPI`
- The bridge contract is declared in `src/@types/context.d.ts`

---

*Integration audit: 2026-04-29*
