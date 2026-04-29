---
phase: 01-vbs-free-edge-discovery
reviewed: 2026-04-29T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/driver_downloader.ts
  - src/main.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Phase 1 の実装変更は、`regedit` 依存の除去と PowerShell 実行境界の明確化という目的には概ね沿っています。`RegistryValidator` によるキーの allowlist 制約と `main.ts` 側の `SecurityError` 分岐も維持されていました。

一方で、新しく導入した PowerShell 起動が実行ファイル名の相対解決に依存しており、探索パス上の偽 `powershell.exe` を起動し得るため、今回の変更でセキュリティ境界が一段緩くなっています。

## Warnings

### WR-01: `powershell.exe` を相対名で起動しており、実行ファイル探索ハイジャックが可能

**File:** `src/driver_downloader.ts:15,271-278`
**Issue:** `POWERSHELL_EXECUTABLE = "powershell.exe"` を `execFile()` に渡しているため、Windows の実行ファイル探索順序に依存します。アプリ実行ディレクトリやカレントディレクトリ、PATH 上に偽の `powershell.exe` が置かれた場合、固定引数であっても任意バイナリ実行に置き換えられます。Phase 1 の意図は「bounded PowerShell execution」ですが、実際には起動対象のバイナリ自体が固定されていません。
**Fix:**
```ts
const systemRoot = process.env.SystemRoot ?? "C:\\Windows";
const POWERSHELL_EXECUTABLE = path.join(
    systemRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
);
```

`process.env.ComSpec` のような可変な環境変数ではなく、`SystemRoot` を基点に絶対パス化して `execFile()` に渡してください。起動前に `fs.existsSync()` で存在確認し、見つからない場合は recoverable failure として `undefined` を返す実装にしておくと契約も保てます。

---

_Reviewed: 2026-04-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
