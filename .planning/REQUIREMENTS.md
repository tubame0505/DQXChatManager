# Requirements: DQX Chat Manager Dependency Cleanup

**Defined:** 2026-04-29
**Core Value:** Users can launch the app and log in through Edge without VBS/Windows Script Host dependencies or regedit packaging requirements.

## v1 Requirements

### Edge Discovery

- [ ] **EDGE-01**: App can discover the installed Microsoft Edge executable path on Windows without using the `regedit` npm package.
- [ ] **EDGE-02**: App can read the installed Microsoft Edge product version without using VBS or Windows Script Host helper files.
- [ ] **EDGE-03**: App returns a controlled failure and logs a useful error when Edge path or version detection fails.

### Dependency Cleanup

- [ ] **DEPS-01**: Runtime dependencies no longer include `regedit`.
- [ ] **DEPS-02**: Build scripts no longer copy `node_modules/regedit/vbs/*` into `dist/vbs`.
- [ ] **DEPS-03**: Source and package metadata no longer contain required `regedit` or VBS references except historical documentation if intentionally retained.

### Behavior Preservation

- [ ] **BEHV-01**: Existing EdgeDriver download and cache behavior continues to use the detected Edge version.
- [ ] **BEHV-02**: Existing login flow continues to launch Edge WebDriver from the downloaded or cached driver path.
- [ ] **BEHV-03**: Existing import/export behavior is unchanged by the dependency cleanup.

### Security

- [ ] **SECU-01**: Edge discovery only queries the allowed Edge App Paths registry location or an explicitly bounded fallback.
- [ ] **SECU-02**: Shell execution uses fixed executable names and argument arrays, with no user-controlled command string construction.
- [ ] **SECU-03**: Existing Electron renderer security settings remain unchanged: `contextIsolation` stays enabled and `nodeIntegration` stays disabled.

### Validation

- [ ] **VALD-01**: `npm run compile` completes successfully after the dependency cleanup.
- [ ] **VALD-02**: `npm run build` completes successfully after the dependency cleanup.
- [ ] **VALD-03**: Repository search confirms no active `regedit`/VBS build dependency remains in source or package metadata.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Platform Support

- **PLAT-01**: App can support non-Windows browser discovery paths.
- **PLAT-02**: App can use browser-driver management that does not require manual EdgeDriver version matching.

### Testing

- **TEST-01**: Add automated unit coverage for Edge discovery success and failure paths.
- **TEST-02**: Add automated smoke tests for login/import/export orchestration with mocked WebDriver boundaries.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Selenium replacement | Too broad for a dependency cleanup milestone |
| DQX Hiroba selector redesign | Unrelated to VBS/regedit removal |
| Non-Windows login support | Current app and packaging target Windows x64 |
| Full test-suite rollout | Valuable, but not required to safely remove this dependency |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDGE-01 | TBD | Pending |
| EDGE-02 | TBD | Pending |
| EDGE-03 | TBD | Pending |
| DEPS-01 | TBD | Pending |
| DEPS-02 | TBD | Pending |
| DEPS-03 | TBD | Pending |
| BEHV-01 | TBD | Pending |
| BEHV-02 | TBD | Pending |
| BEHV-03 | TBD | Pending |
| SECU-01 | TBD | Pending |
| SECU-02 | TBD | Pending |
| SECU-03 | TBD | Pending |
| VALD-01 | TBD | Pending |
| VALD-02 | TBD | Pending |
| VALD-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 after initial definition*
