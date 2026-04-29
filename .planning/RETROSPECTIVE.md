# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 - Dependency Cleanup

**Shipped:** 2026-04-29
**Phases:** 3 | **Plans:** 6 | **Sessions:** 1

### What Was Built
- PowerShell-based Edge discovery replaced the `regedit` / VBS dependency without widening the registry scope.
- Package and build metadata were cleaned so `regedit`, `cpx2`, and `dist/vbs` are no longer part of the active path.
- Behavior preservation was verified with compile/build gates and approved Windows `login` / `export` / `import` smoke checks.

### What Worked
- Splitting the work into implementation, cleanup, and behavior-preservation phases kept scope tight and verification explicit.
- Boundary-scoped validation avoided false failures from historical `.planning/` references and generated artifacts.

### What Was Inefficient
- Milestone close required a second pass to add archival artifacts after the implementation phases had already completed.
- Manual Windows smoke validation remained necessary because there is still no automated regression harness for WebDriver flows.

### Patterns Established
- Dependency removal work should explicitly separate source replacement, metadata cleanup, and behavior validation into distinct phases.

### Key Lessons
1. When replacing a Windows-specific dependency, keep the discovery source constant and change only the access mechanism unless there is a verified need to widen scope.
2. For desktop automation changes, compile/build success is not enough; a milestone should still capture an explicit human smoke gate for the end-to-end flow.

### Cost Observations
- Model mix: not tracked
- Sessions: 1
- Notable: The milestone stayed small because the plan constrained itself to dependency cleanup rather than reopening unrelated WebDriver or UI work.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 3 | Introduced phase-by-phase verification for dependency cleanup and behavior preservation. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Manual compile/build plus Windows smoke | n/a | 1 |

### Top Lessons (Verified Across Milestones)

1. Keep dependency-removal milestones narrow so verification remains concrete.
2. Preserve source boundaries and runtime contracts while replacing platform-specific implementation details.
