# Phase 1: VBS-Free Edge Discovery - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current `regedit`-based Microsoft Edge path and version discovery in `src/driver_downloader.ts` with a bounded, VBS-free implementation. This phase only changes Edge discovery and controlled failure handling; dependency removal and build script cleanup are Phase 2, and full behavior/build validation is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Edge Path Discovery
- **D-01:** Use PowerShell to read the default value from `HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe`.
- **D-02:** Preserve the current registry boundary by continuing to validate against the existing allowed Edge App Paths registry location before querying it.
- **D-03:** Do not introduce fixed-path Edge executable probing in Phase 1. If the registry lookup fails, return a controlled failure instead of widening discovery behavior.

### Edge Version Discovery
- **D-04:** Continue reading `VersionInfo.ProductVersion` from the discovered Edge executable path through PowerShell.
- **D-05:** Keep version discovery scoped to Windows. Non-Windows behavior remains `undefined` with debug logging.

### Shell Execution
- **D-06:** Use `child_process.execFile` with `powershell.exe` and fixed argument arrays: `-NoProfile`, `-NonInteractive`, `-ExecutionPolicy`, `Bypass`, and `-Command`.
- **D-07:** Do not include user-controlled input in command construction. The only variable inputs are the validated registry path and the Edge executable path returned by the system lookup.

### Failure Handling
- **D-08:** If registry lookup, executable path extraction, or product version extraction fails, log a useful warning/error and return `undefined`, preserving the current `getBrowserVersion()` contract.
- **D-09:** Security validation failures remain exceptional: log them as security violations and rethrow the `SecurityError`.

### the agent's Discretion
- The planner may decide whether to keep `getWindowsExePath()` as a separate helper or replace it with a more focused Edge discovery helper, as long as the public `getBrowserVersion()` behavior remains stable.
- The planner may choose the exact internal parsing shape for PowerShell output, provided empty output is treated as failure.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Defines the dependency cleanup goal, constraints, and key decisions.
- `.planning/REQUIREMENTS.md` — Defines Phase 1 requirements: `EDGE-01`, `EDGE-02`, `EDGE-03`, `SECU-01`, and `SECU-02`.
- `.planning/ROADMAP.md` — Defines Phase 1 boundary, goal, and success criteria.

### Codebase Map
- `.planning/codebase/ARCHITECTURE.md` — Main/preload/renderer boundaries and login flow.
- `.planning/codebase/INTEGRATIONS.md` — Current Edge registry, PowerShell, EdgeDriver CDN, and IPC integrations.
- `.planning/codebase/STACK.md` — Current dependency/build stack including `regedit` and VBS artifact notes.
- `.planning/codebase/CONCERNS.md` — Packaging and dependency risks related to `dist/vbs` and generated artifacts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/driver_downloader.ts` — Owns Edge browser version detection, EdgeDriver download/cache paths, and currently contains the `regedit` usage to replace.
- `src/security/security-validator.ts` — Provides `RegistryValidator.validateRegistryPath()` and the current allowed registry path boundary.
- `src/config/app-config.ts` — Contains the same Edge registry path under `APP_CONFIG.REGISTRY.EDGE_PATH`; planner should consider whether to use this constant or leave the existing local constant for minimal change.
- `src/utils/logger.ts` — Existing logging abstraction used by `DriverDownloader`.

### Established Patterns
- `DriverDownloader.getBrowserVersion()` returns `undefined` on unsupported platform or recoverable discovery failure.
- Existing command execution uses `util.promisify(child_process.execFile)` with timeout and maxBuffer controls.
- Security-sensitive failures distinguish `SecurityError` from ordinary operational failures.

### Integration Points
- `src/main.ts` calls `DriverDownloader.getBrowserVersion()` before `getDriver()` during the `login` IPC flow.
- `DriverDownloader.getDriver()` depends on the detected version to construct the EdgeDriver CDN URL and cache path.
- Phase 2 will remove the `regedit` package and VBS copy script after Phase 1 no longer imports or calls `regedit`.

</code_context>

<specifics>
## Specific Ideas

- Keep the implementation close to current behavior: replace only the registry access mechanism, not the surrounding driver download or login flow.
- Prefer controlled failure over broad fallback behavior for Phase 1, because security and compatibility boundaries matter more than discovering unusual Edge installations in this cycle.

</specifics>

<deferred>
## Deferred Ideas

- Fixed-path Edge executable probing — possible future fallback, but deferred because Phase 1 is scoped to the current App Paths registry source.
- Non-Windows browser discovery — tracked as v2 platform support in `.planning/REQUIREMENTS.md`.
- Automated unit tests for Edge discovery — tracked as v2 testing work; Phase 1 should remain narrow unless planning finds a low-cost way to add focused coverage.

</deferred>

---

*Phase: 01-vbs-free-edge-discovery*
*Context gathered: 2026-04-29*
