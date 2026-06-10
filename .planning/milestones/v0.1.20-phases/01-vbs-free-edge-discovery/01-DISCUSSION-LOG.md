# Phase 1: VBS-Free Edge Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 01-VBS-Free Edge Discovery
**Areas discussed:** Edge path discovery, fallback policy, PowerShell invocation

---

## Edge Path Discovery

| Option | Description | Selected |
|--------|-------------|----------|
| PowerShell registry query | Read `HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe` default value with PowerShell while preserving the current registry boundary. | yes |
| `reg.exe query` | Use Windows `reg.exe` and parse stdout. | |
| Fixed path probing | Check common Edge install paths under Program Files. | |

**User's choice:** 推奨で進める
**Notes:** The recommended choice was selected because it removes `regedit`/VBS while staying closest to the current behavior and existing validation model.

---

## Fallback Policy

| Option | Description | Selected |
|--------|-------------|----------|
| No fixed-path fallback in Phase 1 | Treat failed App Paths lookup as controlled failure. | yes |
| Add fixed-path fallback | Try common Edge paths after registry lookup failure. | |
| Add configurable fallback | Add configuration for alternate Edge path discovery. | |

**User's choice:** 推奨で進める
**Notes:** Fixed-path probing is deferred to keep Phase 1 focused and preserve the `SECU-01` registry boundary.

---

## PowerShell Invocation

| Option | Description | Selected |
|--------|-------------|----------|
| `execFile("powershell.exe", fixed args)` | Use `-NoProfile`, `-NonInteractive`, `-ExecutionPolicy Bypass`, and `-Command` with no user-controlled command text. | yes |
| Existing shorter invocation | Keep the current `powershell` call shape with a single command argument. | |
| Shell command string | Use a composed command string. | |

**User's choice:** 推奨で進める
**Notes:** Fixed argument arrays match the current `execFile` style while tightening shell execution boundaries.

---

## the agent's Discretion

- The planner may choose the internal helper layout and parsing details.
- The planner may decide whether `APP_CONFIG.REGISTRY.EDGE_PATH` should replace the current local constant.

## Deferred Ideas

- Fixed-path fallback for non-standard Edge installs.
- Non-Windows browser discovery.
- Automated tests for Edge discovery helpers.
