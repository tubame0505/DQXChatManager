# Phase 2: Dependency and Packaging Cleanup - Research

**Researched:** 2026-04-29
**Domain:** npm 依存削除、lockfile 更新、Electron build/package cleanup [VERIFIED: repository files]
**Confidence:** HIGH [VERIFIED: repository files][CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- Repo-wide rewriting of historical planning/review documents to erase all mentions of `regedit` or `VBS` — deferred because it does not improve the active runtime/build path.
- Broader build pipeline refactors unrelated to `regedit` / `cpx2` removal — deferred to a future build-maintenance phase if needed.
- Full runtime behavior confirmation after cleanup — deferred to Phase 3.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPS-01 | Runtime dependencies no longer include `regedit`. | `npm uninstall regedit` を package manager の正本操作にする方針、lockfile 更新、active reference search 手順を提示 [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][VERIFIED: repository files] |
| DEPS-02 | Build scripts no longer copy `node_modules/regedit/vbs/*` into `dist/vbs`. | `package.json` の `build` script から copy step を削除し、`cpx2` の孤立確認まで同 phase で処理する方針を提示 [VERIFIED: repository files] |
| DEPS-03 | Source and package metadata no longer contain required `regedit` or VBS references except historical documentation if intentionally retained. | D-08/D-09 に沿う検索境界、`AGENTS.md` と `src/deploy.md` を含む active docs 候補、false positive 回避策を提示 [VERIFIED: repository files] |
| VALD-03 | Repository search confirms no active `regedit`/VBS build dependency remains in source or package metadata. | `rg` ベースの境界付き検索、generated/history 除外、build script と lockfile を別扱いにする検証順を提示 [VERIFIED: repository files] |
</phase_requirements>

## Summary

Phase 2 の本質は「機能改修」ではなく「package manager を正として依存グラフと build metadata を収束させる cleanup」です。現在の active 参照は `package.json` の `build` script と `dependencies.regedit`、`devDependencies.cpx2`、`package-lock.json` の top-level 依存および `node_modules/regedit` / `node_modules/cpx2` エントリ、`AGENTS.md` の build 説明、そして `src/deploy.md` の build 手順です。`src/` 配下の実コードからは `regedit` の active runtime 参照は既に外れており、この phase で runtime Edge discovery を再設計する必要はありません [VERIFIED: repository files].

npm 公式 docs では `npm uninstall` が `package.json` と `package-lock.json` を同時に更新する標準操作です。また `package-lock.json` は npm が `package.json` または `node_modules` を変更したときに自動更新され、再現可能な依存ツリーの正本として commit される前提です。したがって、この phase の plan は manual JSON editing ではなく、依存削除コマンドを中心に組み、差分レビューで build script と active docs を揃える構成にするのが妥当です [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/].

`VALD-03` の難所は、検索境界を広げすぎると `.planning/`、`dist/`、`packages/`、`node_modules/.package-lock.json` のような generated/history ノイズに引っ張られる点です。Plan では D-08/D-09 に従い、active boundary を明示した `rg` 検索を採用し、`package.json` / `package-lock.json` / docs / active scripts の各面を個別に証明するべきです [VERIFIED: repository files][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/].

**Primary recommendation:** `npm uninstall regedit cpx2 --save` を正本操作にし、その後 `package.json` の `build` script と active docs を最小修正し、D-08/D-09 に沿う scoped search で `VALD-03` を閉じる plan にする [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][VERIFIED: repository files].

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Runtime dependency removal (`regedit`) | Build / Tooling [ASSUMED] | Package Metadata [ASSUMED] | 実行時コード変更ではなく npm manifest と lockfile の整合で決まる作業だからです [VERIFIED: repository files][CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/] |
| Build script cleanup (`dist/vbs` copy removal) | Build / Tooling [ASSUMED] | Packaging [ASSUMED] | `package.json` script から VBS copy edge を除去し、webpack 出力自体は維持する責務だからです [VERIFIED: repository files] |
| Packaged app continuity (`buildwin`) | Packaging [ASSUMED] | Build / Tooling [ASSUMED] | `electron-packager` は既存 build 産物を前提に bundle 化するため、cleanup 後も packaging path を壊さない確認が必要です [VERIFIED: repository files][CITED: https://electron.github.io/packager/main/index.html] |
| Active-reference audit (`VALD-03`) | Repository Validation [ASSUMED] | Documentation [ASSUMED] | 問題は runtime ではなく active source/package/docs に残留参照がないことの証明だからです [VERIFIED: repository files] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm CLI | 10.9.7 [VERIFIED: local command `npm --version`] | `npm uninstall` で manifest と lockfile を同期削除する [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/] | 手編集ではなく package manager に tree 更新を任せるのが標準だからです [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/] |
| `package-lock.json` | lockfileVersion 3 [VERIFIED: repository files] | 依存ツリーの再現性と差分可視化を保つ [CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/] | Phase 2 の成功条件は lockfile からも `regedit` / `cpx2` が消えることだからです [VERIFIED: repository files] |
| webpack | 5.106.2, published 2026-04-15 [VERIFIED: `npm view webpack version time --json`] | 既存 `build` の bundle 生成を継続する [VERIFIED: repository files] | この phase は webpack 設定を触らず build step の後段 copy だけを外すのが最小だからです [VERIFIED: repository files] |
| electron-packager | 17.1.2, published 2023-08-18 [VERIFIED: `npm view electron-packager version time --json`] | `buildwin` で Windows app を package する [VERIFIED: repository files] | packaging は現行ツールのまま維持し、cleanup 後の coherence だけ確認すべきだからです [VERIFIED: repository files][CITED: https://electron.github.io/packager/main/index.html] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ripgrep | 15.1.0 [VERIFIED: local command `rg --version`] | D-08/D-09 に沿う active-reference search を高速に実行する [VERIFIED: repository files] | `VALD-03` を source/package/docs 境界付きで証明するとき [VERIFIED: repository files] |
| regedit | 5.1.4, published 2025-04-17 [VERIFIED: `npm view regedit version time --json`] | 現在は削除対象であり、新規利用禁止 [VERIFIED: repository files][CITED: https://www.npmjs.com/package/regedit] | Phase 1 後の code path では不要になっており、Phase 2 で dependency graph から除去するため [VERIFIED: repository files] |
| cpx2 | 8.0.2, published 2026-04-07 [VERIFIED: `npm view cpx2 version time --json`] | 現在は `cpx` bin を通じて VBS copy にのみ使われている [VERIFIED: repository files][CITED: https://www.npmjs.com/package/cpx2] | VBS copy step 削除後に unused なら同 phase で除去するため [VERIFIED: repository files] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npm uninstall` [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/] | `package.json` / `package-lock.json` 手編集 [ASSUMED] | 手編集は lockfile drift と `node_modules` 残骸を招きやすく、差分が正しくても tree 状態が追随しないリスクがあります [CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/][ASSUMED] |
| D-08 に沿う scoped `rg` | repo 全体 grep [ASSUMED] | `.planning/` や generated outputs の historical/generative 参照を拾って `VALD-03` 判定を曖昧にします [VERIFIED: repository files] |
| 最小 build cleanup | build pipeline の全面整理 [ASSUMED] | Phase 2 の goal を超え、Phase 3 の検証範囲と混線します [VERIFIED: context file] |

**Installation:**
```bash
npm uninstall regedit cpx2 --save
```

**Version verification:** `regedit@5.1.4` published 2025-04-17、`cpx2@8.0.2` published 2026-04-07、`electron-packager@17.1.2` published 2023-08-18、`webpack@5.106.2` published 2026-04-15 を npm registry で確認しました [VERIFIED: `npm view ... version time --json`].

## Architecture Patterns

### System Architecture Diagram
```text
Developer
  -> npm uninstall regedit cpx2
  -> package.json / package-lock.json rewritten by npm
  -> edit build script + active docs
  -> scoped rg audit over {src/, package.json, package-lock.json, AGENTS.md, active scripts}
  -> npm run compile / npm run build (Phase 3 gate, not reopened here) [VERIFIED: AGENTS.md]
  -> buildwin continues to package current dist via electron-packager
```

### Recommended Project Structure
```text
package.json                  # dependency declarations and build scripts
package-lock.json             # authoritative resolved dependency tree
AGENTS.md                     # active contributor-facing build guidance
src/deploy.md                 # active local build sequence note found by scoped search
src/                          # active application/runtime source boundary for VALD-03
scripts/                      # active helper script boundary for VALD-03
```

### Pattern 1: Package Manager Authoritative Removal
**What:** `regedit` / `cpx2` の削除は `npm uninstall` を起点にして `package.json` と `package-lock.json` を同期更新するパターンです [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/].
**When to use:** dependency graph から package を除去し、lockfile を手で触りたくないとき [CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/].
**Example:**
```bash
# Source: https://docs.npmjs.com/uninstalling-packages-and-dependencies/
npm uninstall regedit cpx2
npm uninstall regedit cpx2 --save
```

### Pattern 2: Boundary-Scoped Active Reference Audit
**What:** `VALD-03` は repo-wide grep ではなく、D-08/D-09 の active boundary に限定して証明するパターンです [VERIFIED: context file].
**When to use:** historical docs と generated outputs を残したまま active dependency path だけ無害化したいとき [VERIFIED: context file].
**Example:**
```powershell
# Source: repository decisions in 02-CONTEXT.md
rg -n "regedit|dist/vbs|\bvbs\b" src package.json package-lock.json AGENTS.md scripts
```

### Anti-Patterns to Avoid
- **Manual lockfile surgery:** `package-lock.json` を手編集して npm tree の実状態と乖離させるのは避けるべきです [CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/].
- **Boundaryless search:** `.planning/` や `dist/` を含む grep 結果をそのまま `VALD-03` 失敗扱いにするのは誤りです [VERIFIED: context file].
- **Cleanup に紛れた build refactor:** webpack/electron-packager の整理まで広げると D-05 に反します [VERIFIED: context file].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency removal | `package.json` / `package-lock.json` の手編集 [ASSUMED] | `npm uninstall` [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/] | npm が manifest と lockfile を同期更新するため tree drift を避けられます [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/] |
| VBS copy replacement | 新しい copy helper の導入 [ASSUMED] | copy step 自体を削除 [VERIFIED: context file] | Phase 2 の goal は置換ではなく不要経路の削除だからです [VERIFIED: context file] |
| Active-reference verification | ad-hoc 目視チェック [ASSUMED] | scoped `rg` audit [VERIFIED: local command `rg --version`] | 再現可能な証跡を plan と verification に残せます [VERIFIED: repository files] |

**Key insight:** この phase は「何かを別の仕組みに置き換える」より「不要になった dependency edge を正本ツールで消し、検索境界を厳密にして証明する」方が正しいです [VERIFIED: repository files][CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/].

## Common Pitfalls

### Pitfall 1: `npm uninstall` の save 挙動を暗黙前提にする
**What goes wrong:** user/global `.npmrc` に `save=false` があると、想定した `package.json` / `package-lock.json` 更新が起きない可能性があります [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][ASSUMED].
**Why it happens:** npm docs では `--save` が既定ですが、設定で変わり得るためです [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/].
**How to avoid:** plan では `npm uninstall regedit cpx2 --save` または更新後 diff 確認を明示すると安全です [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][ASSUMED].
**Warning signs:** uninstall 後も `package.json` top-level dependencies に対象 package が残ります [VERIFIED: repository files].

### Pitfall 2: `VALD-03` 検索で history/generated files を拾う
**What goes wrong:** `.planning/` や `dist/` の historical/generated 参照を active dependency と誤認します [VERIFIED: context file].
**Why it happens:** `regedit` / `VBS` は既に planning artifacts に多数残っているためです [VERIFIED: repository files].
**How to avoid:** D-08/D-09 どおり、`src/`, `package.json`, `package-lock.json`, `AGENTS.md`, active scripts に限定します [VERIFIED: context file].
**Warning signs:** 検索結果の大半が `.planning/` や `dist/` に偏ります [VERIFIED: repository files].

### Pitfall 3: `cpx2` を orphaned devDependency として残す
**What goes wrong:** `regedit` と VBS copy step を消しても `cpx2` が lockfile に残り、DEPS-03 が半端になります [VERIFIED: repository files].
**Why it happens:** 現在の active `cpx` 使用箇所は `package.json` の build script だけだからです [VERIFIED: repository files].
**How to avoid:** build script 削除と同じ wave で `cpx2` の repo-wide active usage を確認し、そのまま uninstall します [VERIFIED: repository files].
**Warning signs:** `rg -n "cpx2|\\bcpx\\b"` で `package.json` のみが残存 usage として出ます [ASSUMED].

### Pitfall 4: `buildwin` の前提を誤解して stale `dist/` 問題に踏み込む
**What goes wrong:** cleanup phase 中に packaging reliability 改善まで始めて scope creep します [VERIFIED: repository files].
**Why it happens:** `buildwin` は `build` を自動実行せず、既存 `dist/` 前提で package するため、気になる論点が別件で見えるからです [VERIFIED: repository files][CITED: https://electron.github.io/packager/main/index.html].
**How to avoid:** Phase 2 では VBS copy edge の削除と docs 整合までに留め、compile/build の pass/fail gate は Phase 3 に委ねます [VERIFIED: roadmap and requirements files].
**Warning signs:** plan に webpack refactor や packaging redesign が入り始めます [VERIFIED: context file].

## Code Examples

Verified patterns from official sources:

### Remove dependencies and rewrite manifest/lockfile
```bash
# Source: https://docs.npmjs.com/uninstalling-packages-and-dependencies/
npm uninstall regedit cpx2
```

### Confirm lockfile is authoritative repo state
```text
# Source: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/
package-lock.json is committed and updated when npm modifies package.json or node_modules.
```

### Scoped active-reference audit
```powershell
# Source: 02-CONTEXT.md D-08/D-09 + local repository structure
rg -n "regedit|dist/vbs|\bvbs\b" src package.json package-lock.json AGENTS.md scripts
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `regedit` package + VBS helper shipping in `dist/vbs` [VERIFIED: repository files][CITED: https://www.npmjs.com/package/regedit] | Phase 1 で runtime discovery を VBS-free 化し、Phase 2 で dependency/build path を削除する [VERIFIED: roadmap, requirements, context files] | 2026-04-29 の current milestone [VERIFIED: state and roadmap files] | 依存削除は runtime redesign ではなく cleanup と証明の問題に変わりました [VERIFIED: context file] |

**Deprecated/outdated:**
- `regedit` を Edge discovery のために残す判断: current repo state では outdated です。Phase 1 の decision と Phase 2 の requirements が削除を前提にしています [VERIFIED: requirements, state, context files].
- `cpx node_modules/regedit/vbs/* dist/vbs`: outdated です。runtime path が不要になったため、copy step だけが active packaging edge として残っています [VERIFIED: repository files][VERIFIED: context file].

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npm uninstall` の既定 save 挙動がこの環境でも有効で、user/global `.npmrc` がそれを覆していない [ASSUMED] | Common Pitfalls / Standard Stack | uninstall 後に `package.json` / `package-lock.json` が期待通り更新されず、plan が誤る可能性があります |
| A2 | `Build / Tooling` や `Repository Validation` を architectural tier として扱うのが planner にとって十分実用的である [ASSUMED] | Architectural Responsibility Map | tier 名の粒度が期待とズレる可能性がありますが、実装方針への影響は小さいです |
| A3 | `src/deploy.md` を active build guidance とみなして更新候補に含めるのが適切である [ASSUMED] | Summary / Recommended Project Structure | 文書更新範囲が 1 ファイル広がるかどうかに影響します |
| A4 | `rg -n "cpx2|\\bcpx\\b"` で current repo の `cpx` active usage が `package.json` だけだと証明できる [ASSUMED] | Common Pitfalls | `cpx` が別用途で使われていた場合、`cpx2` 削除判断が早すぎる可能性があります |

## Open Questions (RESOLVED)

1. **`src/deploy.md` を Phase 2 の active docs 更新対象に含めるか**
   - Resolution: `src/deploy.md` は D-08 の active boundary に含めて監査対象とするが、編集はそのファイルに active な `regedit` / VBS guidance が残っている場合に限る、という扱いに確定します [VERIFIED: repository files][VERIFIED: context file].
   - Evidence: 現在の `src/deploy.md` は `predev -> build -> buildwin` の build sequence だけを記述しており、`regedit` / `dist/vbs` / VBS copy step への能動的な案内は含んでいません [VERIFIED: repository files].
   - Planning implication: plan は `src/deploy.md` を audit boundary に含めるが、変更タスクは条件付きのままでよく、今回の cleanup では `AGENTS.md` 側が active guidance の主更新対象です [VERIFIED: context file][ASSUMED].

2. **`npm uninstall` を 1 コマンドにするか 2 段階に分けるか**
   - Resolution: 削除パスは `npm uninstall regedit cpx2 --save` の 1 コマンドを採用し、`package.json` と `package-lock.json` の同期更新を package manager に委ねる方針に確定します [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/].
   - Evidence: `regedit` と `cpx2` はどちらも top-level 依存であり、Phase 2 では両方とも active dependency path から除去するのが D-03/D-04 と整合します [VERIFIED: repository files][VERIFIED: context file].
   - Planning implication: 実装順は従来どおり「usage search -> `npm uninstall regedit cpx2 --save` -> script/doc cleanup -> scoped audit」でよく、削除コマンド自体は 1 回で扱います [VERIFIED: repository files][ASSUMED].

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm CLI, webpack, electron-packager | ✓ [VERIFIED: local command `node --version`] | 22.22.2 [VERIFIED: local command `node --version`] | — |
| npm | dependency removal, lockfile rewrite | ✓ [VERIFIED: local command `npm --version`] | 10.9.7 [VERIFIED: local command `npm --version`] | — |
| ripgrep | fast scoped audit for `VALD-03` | ✓ [VERIFIED: local command `rg --version`] | 15.1.0 [VERIFIED: local command `rg --version`] | `Select-String` [ASSUMED] |

**Missing dependencies with no fallback:**
- None [VERIFIED: local commands].

**Missing dependencies with fallback:**
- None [VERIFIED: local commands].

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [VERIFIED: phase scope] | — |
| V3 Session Management | no [VERIFIED: phase scope] | — |
| V4 Access Control | no [VERIFIED: phase scope] | — |
| V5 Input Validation | yes [ASSUMED] | 検証コマンドは固定パターン・固定対象パスに限定し、user-controlled search を避ける [VERIFIED: context file] |
| V6 Cryptography | no [VERIFIED: phase scope] | — |

### Known Threat Patterns for npm/Electron packaging cleanup

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 依存が manifest から消えても lockfile / local tree に残る | Tampering | `npm uninstall` を使い、`package.json` と `package-lock.json` の両方を diff で確認する [CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/] |
| history/generated files を active dependency と誤判定する | Repudiation | D-08/D-09 に沿う scoped search を証跡として残す [VERIFIED: context file] |
| stale `dist/` を package して cleanup 問題と混同する | Tampering | Phase 2 は metadata cleanup に限定し、behavior/build pass gate は Phase 3 に委譲する [VERIFIED: roadmap and requirements files] |

## Sources

### Primary (HIGH confidence)
- https://docs.npmjs.com/uninstalling-packages-and-dependencies/ - `npm uninstall` が `package.json` と `package-lock.json` を更新する挙動を確認
- https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/ - lockfile の役割、hidden lockfile、commit 前提を確認
- https://electron.github.io/packager/main/index.html - current `electron-packager` CLI の役割と packaging 前提を確認
- Local repository files (`package.json`, `package-lock.json`, `AGENTS.md`, `src/deploy.md`, `.planning/...`) - active references, scope locks, requirements, current scripts を確認
- npm registry via `npm view ... version time --json` - `regedit`, `cpx2`, `webpack`, `electron-packager` の current version / publish date を確認

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/regedit - `regedit` が Windows Script Host / VBS 前提の package であることを確認
- https://www.npmjs.com/package/cpx2 - `cpx2` が `cpx` bin を提供する maintained fork であることを確認

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存 repo 状態、npm docs、registry version を直接確認したため [VERIFIED: repository files][CITED: https://docs.npmjs.com/uninstalling-packages-and-dependencies/]
- Architecture: MEDIUM - phase-specific の tier naming に一部 `[ASSUMED]` を含むため
- Pitfalls: HIGH - 現在の scripts/docs/search results と npm docs の組み合わせで再現リスクを具体化できたため [VERIFIED: repository files][CITED: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/]

**Research date:** 2026-04-29
**Valid until:** 2026-05-29
