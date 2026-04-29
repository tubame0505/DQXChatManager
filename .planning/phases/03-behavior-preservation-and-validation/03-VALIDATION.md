# Phase 3 Validation Evidence

**Phase:** 03-behavior-preservation-and-validation  
**Plan:** 03-01  
**Recorded:** 2026-04-29

## Scope Boundary

- This artifact records automated validation evidence and preserved source-contract evidence only.
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

## Gate Readout

- `VALD-01`: pass
- `VALD-02`: pass
- Regression boundary: none detected in the required automated gates for this plan.
