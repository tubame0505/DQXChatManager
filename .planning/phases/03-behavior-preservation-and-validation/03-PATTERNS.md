# Phase 3: Behavior Preservation and Validation - Patterns Note

**Mapped:** 2026-04-29
**Scope reviewed:** `.planning/phases/01-*`, `.planning/phases/02-*`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/CONCERNS.md`

## What Existing Artifacts Establish

- Phase-level validation evidence lives in a single `{phase}-VALIDATION.md` file, not inside plan summaries.
- Plan execution summaries use `{phase}-{plan}-SUMMARY.md` naming and record what was done, what files were created, and self-check status.
- Verification is a separate downstream artifact named `{phase}-VERIFICATION.md`; it audits whether the phase goal and evidence hold after execution. It does not replace `{phase}-VALIDATION.md`.

## Naming And Placement To Preserve

| Artifact | Existing pattern | Phase 3 implication |
| --- | --- | --- |
| Validation evidence | `01-VALIDATION.md`, `02-VALIDATION.md` | Create `03-VALIDATION.md` as the main evidence file |
| Plan summaries | `01-01-SUMMARY.md`, `01-02-SUMMARY.md`, `02-01-SUMMARY.md`, `02-02-SUMMARY.md` | If Phase 3 is split, keep one summary per plan using `03-01-SUMMARY.md`, `03-02-SUMMARY.md`, etc. |
| Verification report | `02-VERIFICATION.md` | Leave room for a later `03-VERIFICATION.md`; do not collapse verification into the validation artifact |

## Validation Artifact Conventions

### Shared structure already used

- Header with `Phase`, `Plan`, and `Recorded` metadata.
- `## Scope Boundary` section that states what the artifact validates and what is explicitly out of scope.
- Distinct evidence sections instead of a single undifferentiated note.
- A closing readout summarizing why the phase is considered validated.

### Evidence style already used

- Commands are written literally, usually in fenced code blocks when important to reproducibility.
- Results are recorded as `passed`, `completed as evidence`, `approved`, or equivalent explicit status language.
- Observed warnings or caveats are preserved in the artifact rather than omitted.
- Requirement traceability is explicit when the phase has scoped requirements.

## Phase 3 Evidence Pattern

Phase 3 should follow the same artifact discipline, but with stricter gating than Phase 1:

- `npm run compile` should be recorded as a required pass/fail gate.
- `npm run build` should be recorded as a required pass/fail gate.
- Manual smoke evidence should be recorded as three separate checks:
  - `login`
  - `export`
  - `import`
- Security preservation evidence should be explicit in the same validation artifact:
  - `contextIsolation: true`
  - `nodeIntegration: false`

## Alignment With Existing Planning Artifacts

### Boundary discipline

- Preserve the Phase 1 and Phase 2 pattern of validating within a narrow boundary rather than redesigning implementation during validation.
- If a regression is found, record it as a failure or follow-up; do not silently expand Phase 3 into a fix phase.

### Behavior preservation framing

- Treat `src/driver_downloader.ts`, `src/main.ts`, `src/dqx-hiroba.ts`, `src/services/webdriver-session.ts`, and `src/services/emote-manager.ts` as preserved behavior surfaces.
- Evidence should confirm current behavior still holds; it should not restate new design decisions unless a regression forces a separate remediation phase.

### Manual validation model

- `.planning/codebase/TESTING.md` establishes that this repo relies on `npm run compile`, `npm run build`, and Windows manual smoke checks instead of an automated test suite.
- The planner should therefore keep manual smoke evidence as first-class phase output, not as an informal note in a summary.

### Security evidence model

- `.planning/codebase/CONVENTIONS.md` and `.planning/codebase/CONCERNS.md` treat Electron security defaults as non-negotiable and explicitly important.
- Phase 3 should mirror Phase 1's source-contract style by citing the relevant `src/main.ts` settings directly in `03-VALIDATION.md`.

## Downstream Planner Preservation Rules

1. Keep one phase-level `03-VALIDATION.md` as the canonical evidence artifact.
2. Keep plan summaries separate from validation evidence.
3. Treat both `npm run compile` and `npm run build` as gates, not optional evidence.
4. Record manual smoke as separate `login`, `export`, and `import` outcomes.
5. Record Electron security settings explicitly in the validation artifact.
6. Preserve narrow validation scope: verify behavior, do not redesign it.

## Concise Pattern Readout

- Existing phases separate implementation/change summaries from validation evidence.
- Validation artifacts are explicit, scoped, and reproducible.
- Manual Windows smoke approval is already an accepted artifact type in this repo.
- Phase 3 should be the first phase where both `compile` and `build` are required pass/fail gates in the validation artifact, with per-flow smoke evidence and explicit Electron security confirmation.
