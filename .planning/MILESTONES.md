# Milestones

## v1.0 - Dependency Cleanup

**Shipped:** 2026-04-29
**Status:** Complete
**Phases:** 3
**Plans:** 6
**Requirements:** 15/15 complete
**Audit:** passed
**Known deferred items at close:** 0

### Delivered

- Replaced `regedit` and VBS-based Edge discovery with bounded PowerShell registry discovery.
- Removed `regedit`, `cpx2`, and `dist/vbs` copy behavior from active dependency and build paths.
- Verified no active `regedit` / VBS references remained in source and package metadata.
- Preserved login, export, and import behavior with successful compile/build gates and approved Windows smoke validation.

### Archive

- [v1.0 roadmap](./milestones/v1.0-ROADMAP.md)
- [v1.0 requirements](./milestones/v1.0-REQUIREMENTS.md)
- [v1.0 audit](./milestones/v1.0-MILESTONE-AUDIT.md)
