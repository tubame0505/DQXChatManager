# Phase 3: Behavior Preservation and Validation - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that the app still behaves the same after Phase 1 and Phase 2. This phase covers compile/build verification, manual smoke validation for login/export/import, and confirmation that Electron security settings remain unchanged. It does not introduce new runtime capabilities or redesign the WebDriver flow.

</domain>

<decisions>
## Implementation Decisions

### Validation Gate
- **D-01:** Treat `npm run compile` as a required pass/fail gate for Phase 3.
- **D-02:** Treat `npm run build` as a required pass/fail gate for Phase 3.
- **D-03:** Record both command outcomes as formal validation evidence, not informal notes.

### Manual Smoke Scope
- **D-04:** Manual smoke validation must cover `login`, `export`, and `import`.
- **D-05:** Record `login`, `export`, and `import` as separate checks in the validation artifact instead of a single combined success/failure note.
- **D-06:** Use the existing Windows-targeted flow only; Phase 3 does not expand validation to new platforms or new user journeys.

### Security Preservation
- **D-07:** Confirm `contextIsolation: true` and `nodeIntegration: false` in `src/main.ts` as part of `SECU-03`.
- **D-08:** Record the security-setting confirmation explicitly in the validation artifact, rather than relying on code review alone.

### Behavior Preservation Boundary
- **D-09:** Validate the existing Edge version detection, EdgeDriver download/cache path, and login orchestration as preserved behavior rather than reopening their design.
- **D-10:** Keep Phase 3 focused on verification. If a failure is found, capture it as a regression to fix rather than expanding scope during planning.

### the agent's Discretion
- The planner may split automated evidence and manual smoke work into separate plans if that produces cleaner verification artifacts.
- The planner may choose the exact artifact structure for validation and verification, provided each requirement is traceable to distinct evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Current milestone state after Phase 2 and the remaining validation goal.
- `.planning/REQUIREMENTS.md` — Defines `BEHV-01`, `BEHV-02`, `BEHV-03`, `SECU-03`, `VALD-01`, and `VALD-02`.
- `.planning/ROADMAP.md` — Defines the Phase 3 goal, success criteria, and dependency on Phase 2.
- `.planning/STATE.md` — Current phase focus and blocker note for post-cleanup validation.

### Prior Phase Decisions
- `.planning/phases/01-vbs-free-edge-discovery/01-CONTEXT.md` — Locks the bounded PowerShell discovery behavior that Phase 3 must preserve.
- `.planning/phases/01-vbs-free-edge-discovery/01-VALIDATION.md` — Shows the Phase 1 compile/build evidence and approved Windows login smoke baseline.
- `.planning/phases/02-dependency-and-packaging-cleanup/02-CONTEXT.md` — Locks the dependency cleanup boundary and confirms Phase 2 did not reopen runtime design.
- `.planning/phases/02-dependency-and-packaging-cleanup/02-VALIDATION.md` — Shows the active-boundary cleanup evidence that Phase 3 builds on.
- `.planning/phases/02-dependency-and-packaging-cleanup/02-VERIFICATION.md` — Confirms Phase 2 passed and defines the remaining validation boundary.

### Code and Validation Surfaces
- `package.json` — Source of truth for `npm run compile`, `npm run build`, and current package/build metadata.
- `src/main.ts` — Contains the login IPC flow and Electron security settings that must remain unchanged.
- `src/driver_downloader.ts` — Owns Edge version detection and EdgeDriver download/cache behavior that Phase 3 must preserve.
- `src/dqx-hiroba.ts` — Coordinates login, export, and import flows.
- `src/services/webdriver-session.ts` — Owns Selenium Edge session startup and reuse behavior.
- `src/services/emote-manager.ts` — Owns export/import orchestration.
- `.planning/codebase/TESTING.md` — Documents the repo's current validation model as compile/build plus manual smoke checks.
- `.planning/codebase/CONVENTIONS.md` — Reiterates the Electron security settings and repo validation expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` — Already exposes the exact command entry points Phase 3 must run and record.
- `src/main.ts` — Central place to confirm `contextIsolation` and `nodeIntegration`, and to trace login orchestration from IPC to driver setup.
- `src/dqx-hiroba.ts` — Single coordinator for login/export/import smoke coverage.
- `src/driver_downloader.ts` — Single coordinator for browser version lookup and EdgeDriver installation/caching.
- `src/utils/logger.ts` — Existing logging path that can supply runtime evidence during smoke validation.

### Established Patterns
- This repository uses explicit command evidence plus manual runtime checks instead of an automated test suite.
- Phase 1 and Phase 2 already separated implementation change from dependency cleanup; Phase 3 should preserve that separation by validating rather than redesigning.
- Security-sensitive Electron settings are declared directly in `src/main.ts` and treated as non-negotiable defaults.

### Integration Points
- `src/main.ts` calls `DriverDownloader.getBrowserVersion()` and `getDriver()` before `DqxHiroba.login()`, so login smoke inherently covers the preserved driver path.
- `DqxHiroba.exportEmote()` and `DqxHiroba.importEmote()` route through `EmoteManager`, making those methods the natural smoke boundary for `BEHV-03`.
- `npm run compile` and `npm run build` remain the repository's top-level automated validation entry points after Phase 2 cleanup.

</code_context>

<specifics>
## Specific Ideas

- Manual validation should be recorded as three separate outcomes: `login`, `export`, and `import`.
- Security confirmation should appear in the same validation artifact as compile/build results so Phase 3 has one traceable evidence set.

</specifics>

<deferred>
## Deferred Ideas

- Adding automated integration or E2E coverage for login/import/export — useful, but outside this milestone.
- Expanding validation to non-Windows platforms — out of scope for the current Windows-only app.
- Reworking WebDriver behavior or DQX Hiroba automation selectors — Phase 3 only validates current behavior.

</deferred>

---

*Phase: 03-behavior-preservation-and-validation*
*Context gathered: 2026-04-29*
