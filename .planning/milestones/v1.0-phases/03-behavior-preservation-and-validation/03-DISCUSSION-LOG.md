# Phase 3: Behavior Preservation and Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 03-behavior-preservation-and-validation
**Areas discussed:** manual smoke scope, validation gates, security evidence, manual recording granularity

---

## Manual Smoke Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Login only | Validate only the login path | |
| Login + export + import | Cover the full Phase 3 behavior scope | ✓ |

**User's choice:** `login + export + import`
**Notes:** Phase 3 should map directly to `BEHV-01`, `BEHV-02`, and `BEHV-03`.

---

## Validation Gates

| Option | Description | Selected |
|--------|-------------|----------|
| Compile only | Treat `npm run compile` as sufficient | |
| Compile + build | Require both `npm run compile` and `npm run build` to pass | ✓ |

**User's choice:** `npm run compile` and `npm run build` are both required gates
**Notes:** This matches the Phase 3 roadmap success criteria.

---

## Security Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Code check only | Confirm settings in code without explicit validation evidence | |
| Code check + artifact | Confirm the settings and record them in the validation artifact | ✓ |

**User's choice:** `contextIsolation` / `nodeIntegration` must be code-checked and written into the artifact
**Notes:** This closes `SECU-03` with explicit evidence rather than inference.

---

## Manual Recording Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Single result | Record one combined smoke status | |
| Per-flow results | Record `login`, `export`, and `import` separately | ✓ |

**User's choice:** Record `login`, `export`, and `import` separately
**Notes:** Failure localization matters more than a single pass/fail line.

---

## the agent's Discretion

- None.

## Deferred Ideas

- No new scope was added during discussion.
