# Phase 2: Dependency and Packaging Cleanup - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove the remaining active `regedit` and VBS packaging dependency from the repository after Phase 1 has already replaced runtime Edge discovery. This phase covers package metadata, build-script cleanup, and active source/build references only. It does not rework login behavior, browser discovery behavior, or broader validation beyond the dependency cleanup boundary.

</domain>

<decisions>
## Implementation Decisions

### Active Dependency Removal Scope
- **D-01:** Phase 2 removes active `regedit` references from `package.json`, `package-lock.json`, the `build` script, and active developer-facing build guidance such as `AGENTS.md`.
- **D-02:** Phase 2 does not treat generated or transient files as cleanup targets. `dist/`, `packages/`, `.npm-cache/`, and `tsconfig.tsbuildinfo` are out of scope for direct edits in this phase.

### Build and Packaging Cleanup
- **D-03:** Remove `cpx node_modules/regedit/vbs/* dist/vbs` from the `build` script in `package.json`.
- **D-04:** Remove `cpx2` in the same phase if it becomes unused after the VBS copy step is deleted.
- **D-05:** Keep the cleanup minimal and dependency-focused. Do not expand into unrelated build refactors while removing the `regedit` packaging path.

### Historical Reference Policy
- **D-06:** Historical mentions of `regedit` or `VBS` may remain in retrospective planning/review/verification artifacts when they clearly describe prior behavior or decisions.
- **D-07:** Active references should be removed from runtime/build/package metadata, but historical documentation under `.planning/` may keep those terms when the context is explicitly historical.

### Validation Search Boundary
- **D-08:** For `VALD-03`, treat `src/`, `package.json`, `package-lock.json`, `AGENTS.md`, and active build/dev scripts as the “active reference” search boundary.
- **D-09:** Exclude `.planning/` artifacts and generated outputs from the “no active `regedit`/VBS dependency remains” check, unless a file in those areas is still part of an active build/runtime path.

### Behavior Preservation
- **D-10:** Phase 2 must not change the runtime behavior introduced in Phase 1. It only removes now-unused dependency and packaging references.

### the agent's Discretion
- The planner may choose the exact repository search commands and reporting format for proving `VALD-03`, as long as the active-reference boundary above is respected.
- The planner may decide whether any build documentation outside `AGENTS.md` also needs wording updates, provided the work stays directly tied to removing active `regedit`/VBS dependency paths.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Defines the dependency cleanup milestone, current state after Phase 1, and active constraints for Phase 2.
- `.planning/REQUIREMENTS.md` — Defines Phase 2 requirements: `DEPS-01`, `DEPS-02`, `DEPS-03`, and `VALD-03`.
- `.planning/ROADMAP.md` — Defines the Phase 2 goal, success criteria, and dependency on Phase 1.

### Prior Phase Decisions
- `.planning/phases/01-vbs-free-edge-discovery/01-CONTEXT.md` — Locks the runtime behavior already changed in Phase 1 and clarifies that Phase 2 is dependency/build cleanup only.
- `.planning/phases/01-vbs-free-edge-discovery/01-VALIDATION.md` — Shows that `npm run build` still copied `node_modules/regedit/vbs/*` after Phase 1 and records why that remained Phase 2 work.
- `.planning/phases/01-vbs-free-edge-discovery/01-VERIFICATION.md` — Confirms Phase 1 already passed and that Phase 2 should not reopen the Edge discovery design.

### Codebase Map
- `.planning/codebase/STACK.md` — Documents `regedit` and `cpx2` as current dependency/build-stack elements.
- `.planning/codebase/CONCERNS.md` — Documents the packaging risk around pre-built artifacts and `dist/vbs`.
- `.planning/codebase/STRUCTURE.md` — Clarifies generated outputs versus source-of-truth files.

### Active Source and Metadata
- `package.json` — Current runtime/dev dependencies and build scripts.
- `package-lock.json` — Lockfile that still contains `regedit` and potentially `cpx2`.
- `AGENTS.md` — Current contributor guidance that still describes the VBS copy behavior in `npm run build`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` — Single source for the `build` script and dependency declarations that still reference `regedit` and `cpx2`.
- `package-lock.json` — Lockfile update target once `regedit` and any newly-unused packages are removed.
- `AGENTS.md` — Active repository instructions that should match the cleaned build behavior.

### Established Patterns
- Phase 1 already removed runtime `regedit` usage from `src/driver_downloader.ts`, so Phase 2 should not touch browser discovery logic except to confirm no active dependency path remains.
- Generated outputs such as `dist/` and `packages/` are not edited by hand.
- Validation in this repository relies on explicit command runs and targeted repository searches rather than a formal test suite.

### Integration Points
- `npm run build` currently still copies `node_modules/regedit/vbs/*` into `dist/vbs`; Phase 2 removes that packaging edge.
- `npm run buildwin` packages local build artifacts, so the cleanup must leave the build pipeline coherent after the VBS copy step is removed.
- Phase 3 will validate broader behavior preservation and build behavior end-to-end after this dependency cleanup lands.

</code_context>

<specifics>
## Specific Ideas

- Treat this as a narrow cleanup phase: remove the active dependency chain, update active build guidance, and prove the repository no longer depends on `regedit`/VBS in active paths.
- Leave historical planning/review artifacts intact when they describe what used to exist, instead of rewriting project history.

</specifics>

<deferred>
## Deferred Ideas

- Repo-wide rewriting of historical planning/review documents to erase all mentions of `regedit` or `VBS` — deferred because it does not improve the active runtime/build path.
- Broader build pipeline refactors unrelated to `regedit` / `cpx2` removal — deferred to a future build-maintenance phase if needed.
- Full runtime behavior confirmation after cleanup — deferred to Phase 3.

</deferred>

---

*Phase: 02-dependency-and-packaging-cleanup*
*Context gathered: 2026-04-29*
