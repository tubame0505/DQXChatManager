# Roadmap: DQX Chat Manager Dependency Cleanup

## Overview

This cycle removes the `regedit`/VBS dependency from Edge discovery and packaging while keeping the existing Windows EdgeDriver login, export, and import behavior intact. The work is intentionally narrow: replace the discovery mechanism, clean the build artifacts, then verify the app still behaves the same from a user perspective.

## Phases

- [ ] **Phase 1: VBS-Free Edge Discovery** - Replace registry access with a bounded, VBS-free way to find Edge and read its version.
- [ ] **Phase 2: Dependency and Packaging Cleanup** - Remove `regedit` from the dependency graph and stop shipping VBS helpers.
- [ ] **Phase 3: Behavior Preservation and Validation** - Confirm login, driver download, import/export, and build behavior remain unchanged.

## Phase Details

### Phase 1: VBS-Free Edge Discovery
**Goal**: Users can launch login on Windows without `regedit` or VBS helpers, and the app still discovers the installed Edge path and version safely.
**Depends on**: Nothing (first phase)
**Requirements**: EDGE-01, EDGE-02, EDGE-03, SECU-01, SECU-02
**Success Criteria** (what must be TRUE):
  1. The app can find the installed Microsoft Edge executable on Windows without using the `regedit` package.
  2. The app can read the installed Edge product version without relying on VBS or Windows Script Host helper files.
  3. If Edge path or version detection fails, the app stops with a controlled error and logs a useful message.
  4. Registry access stays limited to the allowed Edge App Paths location, and shell execution uses fixed commands and arguments.
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md - Replace regedit-based Edge discovery with bounded PowerShell helpers in `DriverDownloader`.
- [ ] 01-02-PLAN.md - Validate the new discovery contract with compile/build evidence and a Windows login smoke check.

### Phase 2: Dependency and Packaging Cleanup
**Goal**: The runtime and build pipeline no longer depend on `regedit` or copied VBS artifacts.
**Depends on**: Phase 1
**Requirements**: DEPS-01, DEPS-02, DEPS-03, VALD-03
**Success Criteria** (what must be TRUE):
  1. `regedit` is no longer present as a runtime dependency.
  2. `npm run build` no longer copies `node_modules/regedit/vbs/*` into `dist/vbs`.
  3. Active source and package metadata no longer contain required `regedit` or VBS references.
  4. A repository search for `regedit` and VBS only turns up intentional historical documentation, not active build/runtime dependency paths.
**Plans**: TBD

### Phase 3: Behavior Preservation and Validation
**Goal**: After the dependency cleanup, the app still behaves the same for login, driver management, import/export, and build validation.
**Depends on**: Phase 2
**Requirements**: BEHV-01, BEHV-02, BEHV-03, SECU-03, VALD-01, VALD-02
**Success Criteria** (what must be TRUE):
  1. The app still uses the detected Edge version to download or reuse the matching EdgeDriver.
  2. The login flow still launches Edge WebDriver from the downloaded or cached driver path.
  3. Import and export behavior remains unchanged in normal use.
  4. `npm run compile` and `npm run build` both complete successfully after the cleanup.
  5. Electron renderer security settings remain unchanged: `contextIsolation` stays enabled and `nodeIntegration` stays disabled.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. VBS-Free Edge Discovery | 1/2 | In progress | 01-01 |
| 2. Dependency and Packaging Cleanup | 0/TBD | Not started | - |
| 3. Behavior Preservation and Validation | 0/TBD | Not started | - |
