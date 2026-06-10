# Phase 3 Validation Evidence

**Phase:** 03-behavior-preservation-and-validation  
**Plan:** 03-01  
**Recorded:** 2026-04-29

## Scope Boundary

- This artifact records automated validation evidence, preserved source-contract evidence, and manual Windows smoke verification outcomes.
- Phase 3 does not redesign runtime behavior, WebDriver orchestration, or Electron security settings.
- Generated outputs such as `dist/` and `packages/` are observed command results only and are never hand-edited.

## Automated Validation Gates

### `npm run compile`

- Date: 2026-04-29T18:52:40.5514965+09:00
- Command: `npm run compile`
- Result: passed
- Gate: `VALD-01`
- Evidence:
  - `tsc -p tsconfig.main.json` completed successfully.
  - Development webpack build completed successfully.
  - Renderer assets were emitted and webpack reported `compiled successfully`.
- Non-blocking warnings:
  - None observed in this run.

### `npm run build`

- Date: 2026-04-29T18:52:40.5514965+09:00
- Command: `npm run build`
- Result: passed
- Gate: `VALD-02`
- Evidence:
  - Production webpack completed for `main`, `preload`, and renderer bundles.
  - The build finished with warnings, but webpack completed successfully and did not fail the gate.
- Non-blocking warnings:
  - `selenium-webdriver/lib/http.js`: `Critical dependency: the request of a dependency is an expression`
  - `ws/lib/buffer-util.js`: `Can't resolve 'bufferutil'`
  - `ws/lib/validation.js`: `Can't resolve 'utf-8-validate'`

### Gate Timestamp Note

- The `npm run compile` and `npm run build` timestamps above reflect the same batch-capture time from the Phase 3 automated gate run.

## Gate Readout

- `VALD-01`: pass
- `VALD-02`: pass
- Regression boundary: none detected in the required automated gates for this plan.

## Source-Contract Evidence

### `SECU-03`: Electron renderer security defaults preserved

- `src/main.ts:17` keeps `contextIsolation: true`.
- `src/main.ts:18` keeps `nodeIntegration: false`.
- Assessment:
  - The Electron renderer security defaults remain unchanged from the required secure baseline.
  - No runtime redesign or relaxation of the renderer boundary was observed.

### `BEHV-01`: Driver orchestration preserved

#### Login IPC chain

- `src/main.ts:58` keeps the login entry point at `ipcMain.on("login", async (_e, profile: string) => {`.
- `src/main.ts:64` still obtains the Edge version via `const edgeVersion = await downloader.getBrowserVersion();`.
- `src/main.ts:70` still checks the cache state first with `if (!downloader.isDriverInstalled(__dirname, edgeVersion)) {`.
- `src/main.ts:74` still calls `const driverResult = await downloader.getDriver(__dirname, edgeVersion);`.
- `src/main.ts:80` still gates login on an installed driver path via `await dqxHiroba.login(driverResult.path, profile);`.

#### Driver cache/download contract

- `src/driver_downloader.ts:47` keeps `async getDriver(basePath: string, version: string | undefined = undefined): Promise<DriverResult>`.
- `src/driver_downloader.ts:52-53` still falls back to `getBrowserVersion()` only when no version was provided by the caller.
- `src/driver_downloader.ts:62` still resolves the target executable through `const driverPath = this.getDriverPath(basePath, version);`.
- `src/driver_downloader.ts:73` still checks `if (this.isDriverInstalled(basePath, version)) {` before any download path proceeds.
- `src/driver_downloader.ts:153-156` keeps `isDriverInstalled()` implemented as `getDriverPath(basePath, version)` plus a safe file-exists check.
- `src/driver_downloader.ts:312` keeps `getDriverPath(basePath, version)` resolving `path.join(basePath, "win64", version, "msedgedriver.exe")`.

#### Login handoff into WebDriver session

- `src/dqx-hiroba.ts:65` still hands the resolved driver path into `await this.webDriverSession.initialize(driverPath, profilePath);`.
- `src/dqx-hiroba.ts:66` still follows initialization with `await this.webDriverSession.navigateToTarget();`.
- `src/services/webdriver-session.ts:33` keeps the `initialize(driverPath, profilePath?)` contract intact.
- `src/services/webdriver-session.ts:72` keeps the `navigateToTarget()` contract intact.

### Contract Readout

- `SECU-03`: pass
- `BEHV-01` source-contract portion: pass
- Regression note: none detected while inspecting the preserved security and driver orchestration contracts.

## Manual Windows Smoke Verification

Status: approved

### `login`

- Result: passed
- Requirement impact: `BEHV-01`, `BEHV-02`
- Observed outcome:
  - `npm run dev` was used on Windows as the runtime smoke path.
  - The normal login flow completed successfully.
  - The app continued through the existing EdgeDriver path without a reported regression.
  - No failure boundary was reported for cached-driver reuse or matching-driver download behavior.

### `export`

- Result: passed
- Requirement impact: `BEHV-03`
- Observed outcome:
  - The normal export flow completed successfully after login.
  - No runtime regression was reported for export orchestration or completion behavior.

### `import`

- Result: passed
- Requirement impact: `BEHV-03`
- Observed outcome:
  - The normal import flow completed successfully after login.
  - No runtime regression was reported for import orchestration or confirmation-dialog handling.

## Phase 3 Validation Readout

- `VALD-01`: pass
- `VALD-02`: pass
- `SECU-03`: pass
- `BEHV-01`: pass
- `BEHV-02`: pass
- `BEHV-03`: pass
- Regression boundary: none reported in the approved Windows `login` / `export` / `import` smoke run.
