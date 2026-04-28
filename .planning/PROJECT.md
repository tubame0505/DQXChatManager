# DQX Chat Manager Dependency Cleanup

## What This Is

DQX Chat Manager is an existing Windows Electron app that automates DQX Hiroba emote-message export and import through Microsoft Edge WebDriver. This project cycle focuses on reducing packaging and runtime risk by removing the `regedit`/VBS dependency used for Edge browser discovery while preserving the current login, driver download, import, and export behavior.

## Core Value

Users can launch the app and log in through Edge without VBS/Windows Script Host dependencies or regedit packaging requirements.

## Requirements

### Validated

- ✓ User can launch a Windows Electron desktop app with a React renderer and secure preload bridge — existing
- ✓ User can start an Edge WebDriver session for DQX Hiroba login — existing
- ✓ User can export DQX Hiroba emote settings into tab-separated text — existing
- ✓ User can import tab-separated emote settings back into DQX Hiroba — existing
- ✓ App can download and cache the matching Microsoft EdgeDriver version under the app directory — existing
- ✓ Renderer access to privileged APIs is mediated through `contextBridge` with `contextIsolation` enabled and `nodeIntegration` disabled — existing

### Active

- [ ] Replace `regedit` registry access with a VBS-free Edge discovery implementation.
- [ ] Remove `regedit` and copied VBS artifacts from the build/package dependency path.
- [ ] Preserve existing Edge version detection, EdgeDriver download, and login behavior on Windows.
- [ ] Keep registry/path validation and command execution security boundaries at least as strict as the current implementation.

### Out of Scope

- Adding non-Windows login support — current app packaging and EdgeDriver flow are Windows x64 focused.
- Reworking DQX Hiroba import/export automation — this cycle is dependency cleanup, not WebDriver behavior redesign.
- Replacing Selenium WebDriver — too broad for the current goal.
- Adding a full automated test suite — compile/build and targeted validation are sufficient for this dependency cleanup cycle.

## Context

The current implementation reads `HKLM\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe` through the `regedit` npm package in `src/driver_downloader.ts`, then invokes PowerShell to read `VersionInfo.ProductVersion` from the discovered executable. The `regedit` package uses Windows Script Host (`cscript.exe`) and `.wsf`/`.vbs` helper files internally, so `npm run build` currently copies `node_modules/regedit/vbs/*` into `dist/vbs`.

The codebase map identifies this as a packaging and operational concern: `buildwin` packages prebuilt artifacts, `dist/` is generated, and release correctness depends on local build state. Removing `regedit` should simplify the artifact graph and eliminate the need to ship VBS helpers, while keeping the browser discovery source the same.

The preferred implementation discussed before initialization is PowerShell-based registry discovery using fixed command arguments and no user-controlled command text. This is acceptable because the existing implementation already depends on PowerShell for Edge version extraction.

## Constraints

- **Platform**: Windows x64 remains the target — existing driver detection, driver download, and packaging are Windows-specific.
- **Compatibility**: Edge version detection must continue to use the current Edge App Paths registry key unless a fallback is explicitly needed.
- **Security**: Registry access must remain restricted to the allowed Edge path, and shell execution must avoid user-controlled command construction.
- **Packaging**: Generated outputs such as `dist/` and `packages/` are not edited by hand; source and package metadata drive future build output.
- **Validation**: Before completion, run `npm run compile` and `npm run build`, plus inspect for remaining `regedit`/VBS references in source and package metadata.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use PowerShell instead of `regedit` for Edge registry/version lookup | Removes VBS/Windows Script Host packaging dependency while staying close to current behavior | — Pending |
| Keep Windows-only scope | Existing packaged app and EdgeDriver flow are already Windows x64 oriented | — Pending |
| Treat this as dependency cleanup, not automation redesign | Limits risk and keeps the milestone focused | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after initialization*
