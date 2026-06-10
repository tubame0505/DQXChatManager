---
phase: 01-vbs-free-edge-discovery
plan: 01
subsystem: infra
tags: [electron, powershell, edge, security, webdriver]
requires: []
provides:
  - "Edge App Paths discovery without regedit in DriverDownloader"
  - "Fixed-argument PowerShell execution for Edge path/version lookup"
  - "Preserved getBrowserVersion undefined vs SecurityError contract"
affects: [phase-2-dependency-cleanup, edgedriver-discovery, login-flow]
tech-stack:
  added: []
  patterns: [bounded-powershell-runner, registry-allowlist-validation, recoverable-discovery-failures]
key-files:
  created: [.planning/phases/01-vbs-free-edge-discovery/01-01-SUMMARY.md]
  modified: [src/driver_downloader.ts]
key-decisions:
  - "Edge registry lookup stays bounded to HKLM App Paths msedge.exe and passes through RegistryValidator before PowerShell execution."
  - "PowerShell execution uses execFile with fixed arguments and single-quoted literal escaping for validated dynamic values only."
  - "Recoverable discovery failures keep returning undefined while SecurityError remains exceptional."
patterns-established:
  - "Use a shared PowerShell runner with fixed executable name and arguments for OS discovery work."
  - "Classify discovery failures at the helper boundary so public Electron contracts remain stable."
requirements-completed: [EDGE-01, EDGE-02, EDGE-03, SECU-01, SECU-02]
duration: 18min
completed: 2026-04-29
---

# Phase 1 Plan 01: VBS-Free Edge Discovery Summary

**DriverDownloader の Edge 検出を regedit 依存から bounded PowerShell 実装へ置換し、公開 failure contract を維持した。**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-29T01:36:00Z
- **Completed:** 2026-04-29T01:54:47Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `src/driver_downloader.ts` から `regedit` import と `regedit.list()` ベースの検出経路を除去した。
- `powershell.exe` の固定 executable 名と固定引数配列を使う共通 runner を追加した。
- `getBrowserVersion()` の `undefined` / `SecurityError` 契約を維持しつつ、registry path 取得失敗と version query 失敗のログを分離した。

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace regedit lookup with bounded PowerShell path discovery** - `b32d7e2` (feat)
2. **Task 2: Preserve version lookup and failure classification contract** - `647e40c` (fix)

**Plan metadata:** pending final docs commit

## Files Created/Modified
- `src/driver_downloader.ts` - Edge App Paths lookup と ProductVersion lookup を fixed-argument PowerShell helpers に置換
- `.planning/phases/01-vbs-free-edge-discovery/01-01-SUMMARY.md` - 実行結果と判断記録

## Decisions Made
- `APP_CONFIG.REGISTRY.EDGE_PATH` を discovery の入力に使い、query 対象を `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe` だけに固定した。
- PowerShell 可変値は単一引用符 literal helper を経由し、`exec()` や `shell: true` は使わなかった。
- version query 実行失敗は helper 側で個別にログし、呼び出し側では recoverable failure として `undefined` を返すままにした。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `git commit` 実行時に `.git/index.lock` の権限エラーが出たため、同じ add/commit を権限昇格で再実行した。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 で `package.json` と build scripts から `regedit` / VBS artifact cleanup を進められる。
- ランタイムの Edge discovery は `src/driver_downloader.ts` 内で PowerShell 統一になったため、依存除去の切り離しがしやすい。

## Self-Check

PASSED
- Found `.planning/phases/01-vbs-free-edge-discovery/01-01-SUMMARY.md`
- Found task commits `b32d7e2` and `647e40c` in `git log --oneline --all`
- No known stub markers found in `src/driver_downloader.ts` or this summary

---
*Phase: 01-vbs-free-edge-discovery*
*Completed: 2026-04-29*
