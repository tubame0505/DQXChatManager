# Codebase Concerns

**Analysis Date:** 2026-04-29

## Security Considerations

**Path validation is prefix-based, not boundary-based:**
- Issue: `SecureFileManager` and `PathValidator` use `path.resolve(...).startsWith(...)` to approve file and directory access.
- Files: `src/security/secure-file-manager.ts`, `src/security/security-validator.ts`, `src/driver_downloader.ts`, `src/dqx-hiroba.ts`
- Impact: A sibling path with the same prefix can pass validation, which is dangerous for `rm -r`, file writes, and profile directory creation.
- Fix approach: Boundary-check resolved paths with `path.relative(...)` or an equivalent segment-aware check before any filesystem operation.

**Renderer-to-main IPC surface is broad:**
- Issue: `src/preload.ts` exposes login, import/export, clipboard, and context-menu actions directly to the renderer, and `src/main.ts` routes them with minimal schema validation.
- Files: `src/preload.ts`, `src/main.ts`, `src/web/App.tsx`
- Impact: Any renderer bug can trigger privileged main-process actions, clipboard writes, and Selenium automation.
- Current mitigation: `contextIsolation: true` and `nodeIntegration: false` are enabled in `src/main.ts`.

## Packaging & Build

**Windows packaging depends on pre-built artifacts:**
- Issue: `npm run buildwin` in `package.json` packages the repo without running `build`, while `src/deploy.md` still describes a manual `predev -> build -> buildwin` sequence.
- Files: `package.json`, `src/deploy.md`, `.gitignore`
- Impact: A stale or missing `dist/` can be packaged, and `buildwin` does not itself copy the `regedit` VBS files that `build` places in `dist/vbs`.
- Operational risk: `dist/` and `packages/` are generated outputs and are ignored in `.gitignore`, so release correctness depends on local build state.

**No automated release gate is defined:**
- Issue: `package.json` has no `test` script, and there are no `*.test.*` or `*.spec.*` files under `src/`.
- Files: `package.json`, `src/`
- Impact: TypeScript and bundling regressions are currently caught only by manual compile/build/smoke testing.

## WebDriver Fragility

**Core flows are tightly coupled to the current DQX Hiroba DOM:**
- Issue: XPath selectors and page IDs are hard-coded, and the automation assumes stable element structure and labels.
- Files: `src/utils/xpath-selectors.ts`, `src/services/emote-manager.ts`, `src/services/webdriver-session.ts`, `src/services/emote-handlers.ts`
- Impact: Small site markup changes, label changes, or timing shifts can break login, export, and import flows.
- Current sharp edge: `waitUntilDialogClear()` temporarily sets implicit waits to `0` and treats catch paths as success, which can hide real DOM failures.

**Some failure paths are overly optimistic:**
- Issue: `StampHandler.setEmoteSpecificData()` calls `findElement()` before checking whether the stamp button exists, so the warning branch is effectively unreachable.
- Files: `src/services/emote-handlers.ts`
- Impact: Missing stamp options become hard failures instead of controlled skips, which makes imports brittle.

## Platform & Dependency Constraints

**Runtime is effectively Windows-only:**
- Issue: Driver detection reads `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe`, shells out to PowerShell, and downloads `edgedriver_win64.zip`.
- Files: `src/driver_downloader.ts`, `src/config/app-config.ts`, `package.json`
- Impact: `DriverDownloader.getBrowserVersion()` returns `undefined` off Windows, so login is non-functional on non-Windows platforms.
- Note: `package.json` also pins `buildwin` to `--platform=win32 --arch=x64`, so the packaged app is Windows x64 only.

**Dependency surface is sensitive to browser and Electron churn:**
- Issue: The app depends on Selenium WebDriver, Edge driver download behavior, and Electron packaging of generated bundles.
- Files: `package.json`, `src/driver_downloader.ts`, `src/services/webdriver-session.ts`
- Impact: Browser updates, driver CDN changes, or packaging behavior changes can break login automation without any source-level change.

---

*Concerns audit: 2026-04-29*
