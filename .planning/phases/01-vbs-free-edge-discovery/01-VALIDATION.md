# Phase 1 Validation Evidence

**Phase:** 01-vbs-free-edge-discovery  
**Plan:** 01-02  
**Recorded:** 2026-04-29

## Scope Boundary

- Phase 1 validates the bounded PowerShell discovery contract only.
- Phase 2 cleanup is explicitly out of scope here: `regedit` dependency removal, `dist/vbs` cleanup, and build script cleanup are not validation targets for this file.
- `npm run build` is evidence-only for Phase 1. Its result is recorded below, but it is not a pass/fail gate because VBS-related cleanup is deferred to Phase 2.

## Automated Validation

### `npm run compile`

- Date: 2026-04-29
- Result: passed
- Evidence:
  - `tsc -p tsconfig.main.json` completed.
  - webpack development build completed successfully.
  - No TypeScript or bundling failure blocked Phase 1 validation.

### `npm run build`

- Date: 2026-04-29
- Result: completed as evidence
- Phase treatment: observe-only, not a gate for Plan 01-02
- Evidence:
  - production webpack bundles completed
  - `cpx node_modules/regedit/vbs/* dist/vbs` still ran, which is expected before Phase 2 cleanup
- Observed warnings:
  - `selenium-webdriver/lib/http.js`: critical dependency warning
  - `ws/lib/buffer-util.js`: optional `bufferutil` not found
  - `ws/lib/validation.js`: optional `utf-8-validate` not found
- Assessment:
  - These warnings did not block build completion.
  - They are not treated as a Phase 1 regression because this plan validates discovery behavior, not dependency cleanup.

## Source Contract Evidence

### Bounded PowerShell execution

- `src/driver_downloader.ts:15` uses fixed executable `powershell.exe`.
- `src/driver_downloader.ts:16` defines the fixed argument array `-NoProfile`, `-NonInteractive`, `-ExecutionPolicy`, `Bypass`, `-Command`.
- `src/driver_downloader.ts:271` runs PowerShell through `execFile` with the fixed executable and argument array.

### Registry scope remains bounded

- `src/driver_downloader.ts:171` uses `APP_CONFIG.REGISTRY.EDGE_PATH` as the discovery input.
- `src/driver_downloader.ts:208` validates the registry path via `RegistryValidator.validateRegistryPath(...)` before querying.
- Phase 1 validation target remains the allowed Edge App Paths key only:
  - `HKLM\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe`
- No broader registry probing or fixed-path executable fallback was added in this phase.

### Recoverable failures remain controlled

- `src/driver_downloader.ts:163` keeps `getBrowserVersion(): Promise<string | undefined>`.
- `src/main.ts:64` still calls `getBrowserVersion()` inside the login IPC flow.
- `src/main.ts:66` still stops login with an explicit log when browser version discovery returns no value.

### Security boundary violations remain exceptional

- `src/driver_downloader.ts:191` preserves `SecurityError` handling for browser discovery.
- `src/driver_downloader.ts:228` preserves `SecurityError` handling for registry access.
- `src/main.ts:87` still branches on `SecurityError` and logs it as a security-specific failure path.

### Version extraction still uses Edge executable metadata

- `src/driver_downloader.ts:249` reads `VersionInfo.ProductVersion` from the discovered executable path.
- This preserves the Phase 1 requirement that version detection remains Windows-only and VBS-free.

## Manual Windows Smoke Verification

Status: pending human verification checkpoint

Planned verification:

1. Run `npm run dev` on Windows.
2. Trigger the login flow.
3. Confirm no `regedit`/VBS helper popup or dependency failure appears during login.
4. Confirm normal Edge launch and driver orchestration still work.
5. If Edge detection fails, confirm the app logs a useful message and stops without crashing.

## Phase 1 Readout

- Automated compile evidence supports that the bounded discovery implementation integrates cleanly with the current Electron app.
- Build evidence confirms the repository still packages with pre-existing Phase 2 cleanup behavior intact.
- The remaining gate for this plan is manual Windows smoke verification of the login flow.
