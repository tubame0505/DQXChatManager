# Phase 2 Validation Evidence

**Phase:** 02-dependency-and-packaging-cleanup  
**Plan:** 02-02  
**Recorded:** 2026-04-29

## Scope Boundary

- This phase validates package and build metadata cleanup only.
- Active boundary for pass/fail:
  - `package.json`
  - `package-lock.json`
  - `AGENTS.md`
  - `src/`
  - `scripts/`
  - `src/deploy.md`
- Excluded from pass/fail to avoid false positives:
  - `.planning/`
  - `dist/`
  - `packages/`
  - `.npm-cache/`
  - `tsconfig.tsbuildinfo`
- Runtime behavior is not reopened here. `src/driver_downloader.ts` remains a Phase 1 concern; Phase 2 only confirms no active `regedit`/VBS dependency path remains in current build/package metadata.

## Active-Reference Audit

### Command

```powershell
rg -n "regedit|dist/vbs|\.vbs|\bVBS\b|cpx2|\bcpx\b" package.json package-lock.json AGENTS.md src scripts
```

### Result

- Exit code: `1`
- Interpretation: no matches in the active boundary

## Manifest and Lockfile Convergence

### Dependency removal source of truth

- Command used:

```powershell
npm uninstall regedit cpx2 --save
```

- `package.json` no longer declares:
  - `regedit`
  - `cpx2`
- `package-lock.json` was rewritten by npm and no longer contains top-level or resolved entries for:
  - `regedit`
  - `cpx2`

### Build script state

- `package.json` `build` script now runs:

```json
"build": "cross-env NODE_ENV=\"production\" webpack --progress"
```

- The previous `cpx node_modules/regedit/vbs/* dist/vbs` copy step is removed.

### Active guidance state

- `AGENTS.md` now describes `npm run build` as creating a production `dist/` bundle.
- `src/deploy.md` was checked and contains no active `regedit` or VBS guidance, so it remains unchanged.

## Scope Preservation Evidence

- Phase 2 cleanup did not reopen runtime implementation.
- Relevant changed files inside the active boundary are limited to:
  - `package.json`
  - `package-lock.json`
  - `AGENTS.md`
- `src/driver_downloader.ts` appears in the working tree from Phase 1 hardening work, but it is not part of the Phase 2 cleanup diff target.

## Requirement Trace

- `DEPS-03`
  - Satisfied by removing the VBS copy path from `package.json`, removing `regedit` and `cpx2` from manifest/lockfile, and aligning `AGENTS.md`.
- `VALD-03`
  - Satisfied by the boundary-scoped `rg` audit above, with explicit exclusion of historical/generated files so repo-history noise does not count as failure.

## Phase 2 Readout

- Active build/package references to `regedit`, `cpx2`, `cpx`, `dist/vbs`, `.vbs`, and `VBS` are absent.
- The dependency graph and contributor guidance now match the VBS-free implementation introduced in Phase 1.
- Historical planning artifacts are intentionally excluded from the pass/fail boundary, preventing false positives during future checks.
