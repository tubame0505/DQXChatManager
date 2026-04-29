# Phase 1: VBS-Free Edge Discovery - Research

**Researched:** 2026-04-29  
**Domain:** Electron メインプロセスでの VBS 非依存 Edge 検出  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Edge Path Discovery
- **D-01:** Use PowerShell to read the default value from `HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe`.
- **D-02:** Preserve the current registry boundary by continuing to validate against the existing allowed Edge App Paths registry location before querying it.
- **D-03:** Do not introduce fixed-path Edge executable probing in Phase 1. If the registry lookup fails, return a controlled failure instead of widening discovery behavior.

### Edge Version Discovery
- **D-04:** Continue reading `VersionInfo.ProductVersion` from the discovered Edge executable path through PowerShell.
- **D-05:** Keep version discovery scoped to Windows. Non-Windows behavior remains `undefined` with debug logging.

### Shell Execution
- **D-06:** Use `child_process.execFile` with `powershell.exe` and fixed argument arrays: `-NoProfile`, `-NonInteractive`, `-ExecutionPolicy`, `Bypass`, and `-Command`.
- **D-07:** Do not include user-controlled input in command construction. The only variable inputs are the validated registry path and the Edge executable path returned by the system lookup.

### Failure Handling
- **D-08:** If registry lookup, executable path extraction, or product version extraction fails, log a useful warning/error and return `undefined`, preserving the current `getBrowserVersion()` contract.
- **D-09:** Security validation failures remain exceptional: log them as security violations and rethrow the `SecurityError`.

### the agent's Discretion
- The planner may decide whether to keep `getWindowsExePath()` as a separate helper or replace it with a more focused Edge discovery helper, as long as the public `getBrowserVersion()` behavior remains stable.
- The planner may choose the exact internal parsing shape for PowerShell output, provided empty output is treated as failure.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Fixed-path Edge executable probing — possible future fallback, but deferred because Phase 1 is scoped to the current App Paths registry source.
- Non-Windows browser discovery — tracked as v2 platform support in `.planning/REQUIREMENTS.md`.
- Automated unit tests for Edge discovery success and failure paths — tracked as v2 testing work; Phase 1 should remain narrow unless planning finds a low-cost way to add focused coverage.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDGE-01 | App can discover the installed Microsoft Edge executable path on Windows without using the `regedit` npm package. | PowerShell の Registry provider と `execFile("powershell.exe", fixedArgs)` で `regedit.list` を置き換え、既存の App Paths 境界を維持する。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] [CITED: https://nodejs.org/api/child_process.html] |
| EDGE-02 | App can read the installed Microsoft Edge product version without using VBS or Windows Script Host helper files. | `Get-Item -LiteralPath <exe>.VersionInfo.ProductVersion` は現行挙動と一致し、`FileVersionInfo.ProductVersion` に対応する。 [CITED: https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.fileversioninfo.productversion?view=net-9.0] |
| EDGE-03 | App returns a controlled failure and logs a useful error when Edge path or version detection fails. | 既存の `getBrowserVersion()` と `main.ts` は `undefined` を制御された失敗として扱っているため、その契約を維持しつつログ地点だけを明確化する。 [VERIFIED: codebase grep] |
| SECU-01 | Edge discovery only queries the allowed Edge App Paths registry location or an explicitly bounded fallback. | `RegistryValidator` はすでに Edge App Paths キーだけを allowlist にしているため、Phase 1 ではこれを PowerShell 呼び出しの前段に残す。 [VERIFIED: codebase grep] |
| SECU-02 | Shell execution uses fixed executable names and argument arrays, with no user-controlled command string construction. | `execFile()` は既定で shell を起動せず、固定引数配列と境界付き PowerShell 文字列で要件を満たせる。 [CITED: https://nodejs.org/api/child_process.html] |
</phase_requirements>

## Project Constraints

- 変更対象は `src/` 配下に留め、生成物の `dist/` と `packages/` は手編集しない。 [VERIFIED: AGENTS.md]
- Electron のセキュリティ既定値 `contextIsolation: true` と `nodeIntegration: false` は触らない。 [VERIFIED: AGENTS.md] [VERIFIED: codebase grep]
- このリポジトリの検証基準は `npm run compile`、`npm run build`、`npm run dev` の手動スモークだが、Phase 1 では Phase 2 の依存削除や build cleanup へ越境しない。 [VERIFIED: AGENTS.md] [VERIFIED: ROADMAP/CONTEXT]
- TypeScript / ESLint / Prettier の既存規約、4 スペース、セミコロン、ダブルクォートを維持する。 [VERIFIED: AGENTS.md]

## Summary

Phase 1 の責務は `src/driver_downloader.ts` 内の Edge 検出経路を `regedit` 依存から外すことであり、`package.json` からの削除や `build` スクリプトの VBS コピー除去は Phase 2 に残すべきである。現行フローはすでに正しい公開契約を持っており、回復可能な検出失敗では `getBrowserVersion()` が `undefined` を返し、`SecurityError` は例外のまま `src/main.ts` 側で別扱いされる。 [VERIFIED: codebase grep] [VERIFIED: `src/main.ts`] [VERIFIED: `src/driver_downloader.ts`]

標準実装は、Edge 検出を引き続き Electron メインプロセスに置き、`RegistryValidator` でキー境界を検証したうえで `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe` だけを問い合わせる形である。PowerShell 公式ドキュメントは Registry provider が `HKLM:` と `Registry::HKEY_LOCAL_MACHINE...` を扱えることを示しており、手元の Windows 環境でも App Paths の既定値と Edge の `ProductVersion` を `regedit` や VBS 補助ファイルなしで取得できることを確認した。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] [VERIFIED: local shell] [VERIFIED: local Edge registry probe]

計画上もっとも重要なのは PowerShell 引数の扱いである。Microsoft は `powershell.exe -Command` に文字列を渡す場合、`-Command` が最後の PowerShell パラメータであり、それ以降のトークンは安全な汎用引数チャネルではなくコマンド文字列の一部として解釈されると説明している。したがって Phase 1 の計画では、`$args[0]` に安全に値を渡せる前提を置くべきではない。ロック済み判断 `D-06` を守る最小設計は、検証済みの値だけを PowerShell の単一引用符リテラルへエスケープして埋め込む方式である。 [CITED: https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1] [CITED: https://learn.microsoft.com/en-gb/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7.5]

**Primary recommendation:** `DriverDownloader.getBrowserVersion()` の外部契約は変えず、内部に固定 `execFile("powershell.exe", args, options)` を持つ `runPowerShellQuery()` を 1 つ追加し、App Paths の既定値取得と `VersionInfo.ProductVersion` 取得の 2 クエリへ整理する。 [VERIFIED: codebase grep] [CITED: https://nodejs.org/api/child_process.html]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Edge 実行ファイルパス検出 | Electron Main Process | Windows Registry / PowerShell | `login` IPC はすでに `main.ts` から `DriverDownloader` を呼んでおり、レジストリアクセスは renderer ではなく OS 連携責務である。 [VERIFIED: `src/main.ts`] [VERIFIED: `src/driver_downloader.ts`] |
| Edge バージョン検出 | Electron Main Process | Windows File Metadata / PowerShell | バージョン文字列は driver 解決前に必要で、現行も実行ファイルのメタデータから導出している。 [VERIFIED: `src/driver_downloader.ts`] [CITED: https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.fileversioninfo.productversion?view=net-9.0] |
| レジストリ境界 enforcement | Electron Main Process | Security utility layer | allowlist ポリシーは `RegistryValidator` が持っているため、downloader 側で再実装しない方がよい。 [VERIFIED: `src/security/security-validator.ts`] |
| 失敗ログと停止判定 | Electron Main Process | Renderer log sink | `ElectronLogger` は renderer にログを転送し、`main.ts` は `undefined` を受けると login を止める。 [VERIFIED: `src/utils/logger.ts`] [VERIFIED: `src/main.ts`] |
| Driver ダウンロード再利用 | Electron Main Process | Filesystem | Phase 1 は version-to-driver フローを保存し、download/cache ロジックには触れない。 [VERIFIED: `src/driver_downloader.ts`] [VERIFIED: ROADMAP] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:child_process.execFile` | このワークスペースの Node 実行環境は `v22.22.2`、API は現行 Node ドキュメント `v25.9.0` で確認。 [VERIFIED: local shell] [CITED: https://nodejs.org/api/child_process.html] | `powershell.exe` を shell なしで固定引数配列とともに起動する。 [CITED: https://nodejs.org/api/child_process.html] | `exec()` より安全で、`timeout`、`maxBuffer`、`windowsHide` を持つ。 [CITED: https://nodejs.org/api/child_process.html] |
| `powershell.exe` | 手元環境では Windows PowerShell `5.1.26100.8115`。 [VERIFIED: local shell] | レジストリ 1 件とファイルバージョン 1 件を `regedit` / VBS なしで読む。 [VERIFIED: local shell] [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] | すでに現行実装でもバージョン取得に使っており、新規統合ではなく依存削減になる。 [VERIFIED: `src/driver_downloader.ts`] |
| 既存内部ヘルパー | 追加パッケージ不要。 [VERIFIED: codebase grep] | `RegistryValidator`、`APP_CONFIG.REGISTRY.EDGE_PATH`、`Logger` を再利用する。 [VERIFIED: `src/security/security-validator.ts`] [VERIFIED: `src/config/app-config.ts`] [VERIFIED: `src/utils/logger.ts`] | 既存のセキュリティ境界とロギング契約に乗る方が最小差分で監査しやすい。 [VERIFIED: codebase grep] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `APP_CONFIG.REGISTRY.EDGE_PATH` | リポジトリ既存定数。 [VERIFIED: `src/config/app-config.ts`] | Edge レジストリパスの単一ソース化。 [VERIFIED: `src/config/app-config.ts`] | `driver_downloader.ts` 内の重複文字列を減らしたい場合に使う。 [VERIFIED: codebase grep] |
| `Registry::HKEY_LOCAL_MACHINE...` provider path | PowerShell Registry provider 組み込み。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] | レジストリキーを literal path として明示的に読む。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] | セッション位置や `HKLM:` ドライブ状態に依存しない書き方にしたい場合に使う。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] |
| `windowsHide: true` | `execFile()` がサポート。 [CITED: https://nodejs.org/api/child_process.html] | Windows での余計なコンソール表示を防ぐ。 [CITED: https://nodejs.org/api/child_process.html] | login 発火の UI フローで PowerShell ウィンドウのチラつきを避けたい場合に使う。 [VERIFIED: `src/main.ts`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `regedit` package | PowerShell Registry provider via `powershell.exe` | 推奨。`regedit` 自体は 2025-04-17 時点で `5.1.4` と現行だが、この repo の目標はパッケージ陳腐化対応ではなく VBS 補助チェーンの除去である。 [VERIFIED: local npm view] [VERIFIED: `package.json`] |
| `Get-ItemPropertyValue -Name '(default)'` | `(Get-Item <registryPath>).GetValue('')` | 手元では両方動作したが、`GetValue('')` の方が特殊な default value 名に依存しにくい。 [VERIFIED: local shell] [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] |
| 固定パス Edge 探索 | App Paths lookup only | Phase 1 では `D-03` により除外。現段階では境界拡大より現行ソース維持の方が安全である。 [VERIFIED: CONTEXT.md] |

**Installation:**
```bash
# Phase 1 に新規 npm 依存は不要。 [VERIFIED: research conclusion]
```

**Version verification:** この phase では新規 npm 依存を増やすべきではない。却下対象の `regedit` は `5.1.4`、npm 上の Electron 最新は 2026-04-22 時点で `41.3.0` だが、repo は `41.2.0` を使っており、この phase での Electron アップグレードは不要である。 [VERIFIED: local npm view] [VERIFIED: `package.json`]

## Architecture Patterns

### System Architecture Diagram

```text
Renderer "login" event
    |
    v
Electron main IPC handler (`src/main.ts`)
    |
    v
DriverDownloader.getBrowserVersion()
    |
    +--> platform check (`win32` only) ---- no ---> debug log + return undefined
    |
    +--> RegistryValidator.validateRegistryPath()
            |
            +--> throws SecurityError ----> security log + rethrow
            |
            v
       execFile("powershell.exe", fixed args, registry query)
            |
            +--> empty / error ----> warn/error log + return undefined
            |
            v
       Edge exe path
            |
            v
       execFile("powershell.exe", fixed args, version query)
            |
            +--> empty / error ----> error log + return undefined
            |
            v
       Edge version
            |
            v
DriverDownloader.getDriver(version)
```

この phase では version 取得後の `getDriver()` や `login()` のオーケストレーションを変更しない。 [VERIFIED: `src/main.ts`] [VERIFIED: `src/driver_downloader.ts`]

### Recommended Project Structure
```text
src/
├── driver_downloader.ts           # Edge 検出と driver 解決の責務はここに維持
├── security/security-validator.ts # レジストリ allowlist ポリシーを保持
├── config/app-config.ts           # 必要ならレジストリパス定数の単一ソース
└── utils/logger.ts                # 既存 logger 契約を再利用
```

### Pattern 1: 固定オプション PowerShell ラッパー
**What:** `DriverDownloader` 内に `execFile("powershell.exe", args, options)` を一元化する private helper を 1 つ置き、`-NoProfile`、`-NonInteractive`、`-ExecutionPolicy`、`Bypass`、`-Command`、`timeout`、`maxBuffer`、可能なら `windowsHide: true` を固定化する。 [CITED: https://nodejs.org/api/child_process.html] [VERIFIED: CONTEXT.md]  
**When to use:** レジストリ照会とバージョン照会で同一の起動ポリシーを使いたいとき。 [VERIFIED: `src/driver_downloader.ts`]  
**Example:**
```typescript
// Source: https://nodejs.org/api/child_process.html
private async runPowerShellQuery(command: string): Promise<string> {
    const runCommand = util.promisify(child_process.execFile);
    const result = await runCommand(
        "powershell.exe",
        [
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            command,
        ],
        {
            timeout: 10000,
            maxBuffer: 1024,
            windowsHide: true,
        }
    );

    return result.stdout.trim();
}
```

### Pattern 2: validate → query → failure classify
**What:** レジストリパス検証、パス照会、空文字判定、バージョン照会、空文字判定、`SecurityError` と通常失敗の分離という順序を固定する。 [VERIFIED: `src/security/security-validator.ts`] [VERIFIED: `src/driver_downloader.ts`]  
**When to use:** `getBrowserVersion()` と、将来的に追加される Windows 専用 discovery helper 全般。 [VERIFIED: codebase grep]  
**Example:**
```typescript
// Source: verified against current repo behavior + PowerShell docs
async getBrowserVersion(): Promise<string | undefined> {
    if (process.platform !== "win32") {
        this.logger.debug("Non-Windows platform detected");
        return undefined;
    }

    try {
        const regPath = RegistryValidator.validateRegistryPath(
            APP_CONFIG.REGISTRY.EDGE_PATH
        );
        const edgePath = await this.getWindowsExePath(regPath);
        if (!edgePath) {
            this.logger.warn("Edge executable path not found in registry");
            return undefined;
        }

        const version = await this.getWindowsExeVersion(edgePath);
        if (!version) {
            this.logger.error("Failed to extract Edge product version");
            return undefined;
        }

        return version;
    } catch (error) {
        if (error instanceof SecurityError) {
            this.logger.error("Security violation in registry access", error);
            throw error;
        }
        this.logger.error(
            "Failed to get browser version",
            error instanceof Error ? error : undefined
        );
        return undefined;
    }
}
```

### Anti-Patterns to Avoid
- **`child_process.exec()` や `shell: true` を使う:** `execFile()` で十分であり、shell 解析を挟む理由がない。 [CITED: https://nodejs.org/api/child_process.html]
- **`-Command` 後に安全な追加引数を渡せる前提で設計する:** 公式仕様とずれる。 [CITED: https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1]
- **Phase 1 で `HKCU` や固定インストールパス fallback を入れる:** ロック済みスコープを破る。 [VERIFIED: CONTEXT.md]
- **全失敗を `undefined` に潰す:** `SecurityError` は例外のまま残す必要がある。 [VERIFIED: `src/driver_downloader.ts`] [VERIFIED: `src/main.ts`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| レジストリ探索 | 独自レジストリ parser、`reg.exe` 出力 parser、固定パススキャナ | PowerShell Registry provider で allowlist 済み App Paths 1 キーだけ読む。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] | `reg.exe` 文字列解析はロケール差分と quoting 問題を持ち込みやすい。 [CITED: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6] |
| プロセス起動安全性 | 文字列連結した shell command | `execFile("powershell.exe", fixedArgs, options)`。 [CITED: https://nodejs.org/api/child_process.html] | executable と arguments を構造的に分離できる。 [CITED: https://nodejs.org/api/child_process.html] |
| ファイルバージョン抽出 | PE バイナリの手パース | `Get-Item(...).VersionInfo.ProductVersion`。 [CITED: https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.fileversioninfo.productversion?view=net-9.0] | Windows がすでに公開している情報を再実装する必要がない。 [CITED: https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.fileversioninfo.productversion?view=net-9.0] |
| Phase 1 での cleanup 越境 | package/build cleanup の同時実施 | 依存と packaging cleanup は Phase 2 に送る。 [VERIFIED: ROADMAP] | 発見ロジック差し替えと artifact cleanup を同時にやると回帰切り分けが悪化する。 [VERIFIED: ROADMAP/CONTEXT] |

**Key insight:** この phase の難所は「レジストリの読み方」ではなく、「既存の失敗契約とセキュリティ境界を壊さず transport だけ差し替えること」である。 [VERIFIED: research synthesis]

## Common Pitfalls

### Pitfall 1: `-Command` を安全な argv チャネルだと思い込む
**What goes wrong:** `["-Command", script, value]` を普通の argv と同じだと見なして `$args[0]` 前提の設計にしてしまう。 [CITED: https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1]  
**Why it happens:** `execFile()` は argv ベースだが、`powershell.exe -Command` の文字列解釈は対称ではない。 [CITED: https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1]  
**How to avoid:** `-Command` は固定し、変動値は PowerShell の単一引用符リテラルへエスケープして埋め込む。 [CITED: https://learn.microsoft.com/en-gb/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7.5]  
**Warning signs:** パスに空白があるとプロトタイプだけ壊れる、または実行シェルによって挙動が変わる。 [VERIFIED: local experimentation]

### Pitfall 2: 不正入力と Edge 未検出を同一扱いにする
**What goes wrong:** `RegistryValidator` 失敗が「Edge が無い」に潰れ、ポリシー違反が隠れる。 [VERIFIED: `src/security/security-validator.ts`]  
**Why it happens:** discovery 途中の失敗を 1 個の catch にまとめがちだからである。 [VERIFIED: `src/driver_downloader.ts`]  
**How to avoid:** 現行どおり `SecurityError` はログして再 throw、通常失敗だけ `undefined` に落とす。 [VERIFIED: `src/driver_downloader.ts`]  
**Warning signs:** `main.ts` の login catch で security 専用メッセージが出なくなる。 [VERIFIED: `src/main.ts`]

### Pitfall 3: PowerShell ウィンドウのチラつき
**What goes wrong:** login のたびにコンソールウィンドウが一瞬出る。 [CITED: https://nodejs.org/api/child_process.html]  
**Why it happens:** `execFile()` の `windowsHide` 既定値は `false` である。 [CITED: https://nodejs.org/api/child_process.html]  
**How to avoid:** 共通 runner の options に `windowsHide: true` を入れる。 [CITED: https://nodejs.org/api/child_process.html]  
**Warning signs:** 手動スモークで PowerShell ウィンドウのフラッシュが見える。 [VERIFIED: research inference from API docs]

### Pitfall 4: 現行の二重レジストリ照会を意味もなく温存する
**What goes wrong:** `regedit.list()` 時代の二度引きパターンをそのまま新実装へ持ち込む。 [VERIFIED: `src/driver_downloader.ts`]  
**Why it happens:** 旧実装の retry はライブラリ依存挙動かもしれないのに、その理由がコードに残っていない。 [VERIFIED: `src/driver_downloader.ts`]  
**How to avoid:** PowerShell 照会は 1 回にし、空出力か例外を制御された失敗として扱う。 [VERIFIED: research synthesis]  
**Warning signs:** 差し替え後も理由のない重複 PowerShell 起動が残る。 [VERIFIED: research synthesis]

## Code Examples

Verified patterns from official sources and local probing:

### App Paths の default value を読む
```powershell
# Source: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6
(Get-Item -LiteralPath 'Registry::HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe').GetValue('')
```

この式は手元環境で `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` を返した。 [VERIFIED: local shell]

### 実行ファイルの ProductVersion を読む
```powershell
# Source: https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.fileversioninfo.productversion?view=net-9.0
(Get-Item -LiteralPath 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe').VersionInfo.ProductVersion
```

この式は手元環境で `147.0.3912.86` を返した。 [VERIFIED: local shell]

### TypeScript 側で PowerShell 単一引用符リテラルを作る
```typescript
// Source: https://learn.microsoft.com/en-gb/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7.5
function toPowerShellSingleQuotedLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `regedit.list()` でレジストリ、PowerShell でバージョン | レジストリもバージョンも PowerShell に統一 | この phase で変更予定。`regedit` 自体は 2025-04-17 時点で `5.1.4`。 [VERIFIED: local npm view] | discovery 経路から VBS helper 依存を外しつつ、Windows 専用・App Paths 起点という現行性質は維持できる。 [VERIFIED: CONTEXT.md] |
| 理由不明の二重レジストリ照会 | 空出力を明示判定する単一照会 | 現在の推奨。 [VERIFIED: research synthesis] | 失敗意味論が簡潔になり、不要なプロセス起動も減る。 [VERIFIED: research synthesis] |

**Deprecated/outdated:**
- この repo の現 milestone においては `regedit` ベース discovery は時代遅れである。理由は package 自体の陳腐化ではなく、除去したい VBS packaging path を保持してしまうためである。 [VERIFIED: PROJECT/ROADMAP/REQUIREMENTS]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | このアプリが対象とする Windows 環境では、Edge が引き続き `HKLM\...\msedge.exe` の App Paths default value に登録されている。 [ASSUMED] | Summary / Standard Stack | もし誤っていれば、一部環境で controlled failure となり、将来 phase で fallback 設計が必要になる。 |

## Open Questions (RESOLVED)

1. **Phase 1 で重複したレジストリパス定数を統合するか**
   - What we know: `driver_downloader.ts`、`security-validator.ts`、`app-config.ts` に同一パスが重複している。 [VERIFIED: codebase grep]
   - Resolution: Phase 1 は `APP_CONFIG.REGISTRY.EDGE_PATH` を参照元として使う。`RegistryValidator` の allowlist は既存のまま維持し、public behavior に関係しない広い定数整理は行わない。これで D-02 の境界維持と D-01 の単一レジストリ参照を両立しつつ、追加の scope expansion を避けられる。 [VERIFIED: research synthesis]

2. **helper 形状を `getWindowsExePath()` 維持にするか、より明示的に分けるか**
   - What we know: CONTEXT はこの点を planner 裁量としている。 [VERIFIED: CONTEXT.md]
   - Resolution: `getWindowsExePath()`、`getWindowsExeVersion()`、共通 `runPowerShellQuery()` に分ける。registry lookup failure と version extraction failure のログ地点を分離でき、D-08 の controlled failure と D-09 の exceptional `SecurityError` をレビューしやすく保てるためである。 [VERIFIED: research synthesis]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `powershell.exe` | レジストリ照会とファイルバージョン照会 | ✓ [VERIFIED: local shell] | `5.1.26100.8115` [VERIFIED: local shell] | Phase 1 ではなし。ロック済み設計が依存する。 |
| Node.js runtime | Electron main からの `execFile()` | ✓ [VERIFIED: local shell] | `v22.22.2` [VERIFIED: local shell] | なし。既存アプリ runtime の一部。 |
| `npm` | 後続の compile/build 検証 | ✓ [VERIFIED: local shell via `npm view`] | 存在確認済み。厳密 version はこの phase では不要。 [VERIFIED: local shell] | 実装自体には不要。 |

**Missing dependencies with no fallback:**
- このワークステーション上では未検出。 [VERIFIED: local shell]

**Missing dependencies with fallback:**
- なし。 [VERIFIED: local shell]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 1 は認証情報や identity flow を変更しない。 [VERIFIED: ROADMAP/CONTEXT] |
| V3 Session Management | no | Browser session lifecycle は変更しない。 [VERIFIED: ROADMAP/CONTEXT] |
| V4 Access Control | no | これはローカル OS discovery の変更であり、認可変更ではない。 [VERIFIED: research classification] |
| V5 Input Validation | yes | `RegistryValidator` allowlist と PowerShell 単一引用符エスケープを使う。 [VERIFIED: `src/security/security-validator.ts`] [CITED: https://learn.microsoft.com/en-gb/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7.5] |
| V6 Cryptography | no | 暗号機能や鍵管理の変更はない。 [VERIFIED: research classification] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| shell 構築経由の command injection | Tampering / Elevation of Privilege | `execFile()` を使い、固定 executable、固定引数配列、`shell: true` 不使用を守る。 [CITED: https://nodejs.org/api/child_process.html] |
| レジストリ境界 drift | Tampering | PowerShell コマンドを作る前に `RegistryValidator` で allowlist 検証する。 [VERIFIED: `src/security/security-validator.ts`] |
| 空白や引用符を含むパスの quoting バグ | Tampering | 動的値は PowerShell の単一引用符リテラルにし、`'` を `''` へ変換する。 [CITED: https://learn.microsoft.com/en-gb/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7.5] |
| 失敗の握りつぶし | Repudiation / Reliability | パス取得失敗とバージョン取得失敗を別ログにし、`SecurityError` は例外のまま保つ。 [VERIFIED: `src/driver_downloader.ts`] [VERIFIED: `src/main.ts`] |

## Sources

### Primary (HIGH confidence)
- https://nodejs.org/api/child_process.html - `execFile()`、`shell` 既定値、`timeout`、`maxBuffer`、`windowsHide`
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_registry_provider?view=powershell-7.6 - Registry provider のパス構文と値取得モデル
- https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1 - `powershell.exe -Command` の構文制約
- https://learn.microsoft.com/en-gb/powershell/module/microsoft.powershell.core/about/about_quoting_rules?view=powershell-7.5 - PowerShell 単一引用符エスケープ規則
- https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.fileversioninfo.productversion?view=net-9.0 - `ProductVersion` の意味
- 2026-04-29 のローカル検証 - Node `v22.22.2`、PowerShell `5.1.26100.8115`、`powershell.exe` の解決先、Edge App Paths、Edge `ProductVersion`、npm package metadata
- ローカル codebase - `src/driver_downloader.ts`、`src/main.ts`、`src/security/security-validator.ts`、`src/config/app-config.ts`、`src/utils/logger.ts`、`.planning/*.md`、`AGENTS.md`

### Secondary (MEDIUM confidence)
- https://learn.microsoft.com/en-us/windows/win32/shell/app-registration - App Paths の default value が実行ファイルの完全パスを表すこと

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 新規依存は不要で、重要 API は公式 docs とローカル実機で裏取りした。
- Architecture: HIGH - main process 所有と失敗契約は現行 codebase に明確に現れている。
- Pitfalls: HIGH - 主要リスクは `powershell.exe -Command` の公式仕様と現行コードの境界に直接由来する。

**Research date:** 2026-04-29  
**Valid until:** 2026-05-29
