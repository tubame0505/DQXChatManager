# Phase 2: Dependency and Packaging Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 02-dependency-and-packaging-cleanup
**Areas discussed:** regedit removal scope, build cleanup boundary, historical reference policy

---

## regedit removal scope

| Option | Description | Selected |
|--------|-------------|----------|
| Active refs only | Remove `regedit` from active dependency, build, and contributor guidance paths only | ✓ |
| Broader cleanup | Also clean generated/transient files in this phase | |
| Minimal metadata only | Remove only package metadata references and leave build/docs follow-up | |

**User's choice:** Active refs only, using the recommended boundary.
**Notes:** Phase 2 should remove `package.json`, `package-lock.json`, `build` script, and `AGENTS.md` references, but not edit generated or transient files such as `dist/`, `packages/`, `.npm-cache/`, or `tsconfig.tsbuildinfo`.

---

## build cleanup boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Remove VBS copy and unused helper dependency | Delete the `cpx ... dist/vbs` step and remove `cpx2` if unused | ✓ |
| Remove only VBS copy step | Keep `cpx2` for now even if it becomes unused | |
| Broader build refactor | Rework additional build scripts while touching cleanup | |

**User's choice:** Remove the VBS copy step and remove `cpx2` in the same phase if it becomes unused.
**Notes:** Keep the change narrow and dependency-focused; do not turn Phase 2 into a general build refactor.

---

## historical reference policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep historical mentions where clearly historical | Allow `.planning/` and audit artifacts to describe old behavior | ✓ |
| Remove all mentions everywhere | Rewrite historical docs to erase the old dependency | |
| Leave active docs too | Permit active build/runtime docs to keep stale references | |

**User's choice:** Keep historical mentions where they are clearly retrospective.
**Notes:** `VALD-03` should focus on active runtime/build/package paths. `.planning/` and generated outputs are excluded from the active-reference search unless they are still part of an active build/runtime dependency path.

---

## the agent's Discretion

- Exact repository search commands and reporting format for `VALD-03`
- Whether any active build docs beyond `AGENTS.md` need wording updates once `regedit` / `VBS` references are removed

## Deferred Ideas

- Repo-wide historical documentation rewrite to erase prior `regedit` / `VBS` mentions
- Broader build pipeline cleanup beyond the active dependency chain
- Full post-cleanup behavior verification outside the dependency/build boundary
