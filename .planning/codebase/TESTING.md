# Testing Patterns

**Analysis Date:** 2026-04-29

## Test Framework

**Runner:**
- Not detected.
- No `jest`, `vitest`, or similar test configuration is present in the repository root.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
npm run compile
npm run build
npm run dev
```

## Test File Organization

**Location:**
- No automated test files are present.

**Naming:**
- Not detected.

**Structure:**
```text
No test directory is currently defined.
```

## Test Structure

**Suite Organization:**
```typescript
Not detected.
```

**Patterns:**
- Validation is currently performed with TypeScript compilation, production bundling, and manual runtime checks.
- The repo docs and scripts point to manual smoke testing in `npm run dev`, especially for login, import/export, and WebDriver flows.

## Mocking

**Framework:** Not detected.

**Patterns:**
```typescript
Not detected.
```

**What to Mock:**
- Not detected.

**What NOT to Mock:**
- Not detected.

## Fixtures and Factories

**Test Data:**
```typescript
Not detected.
```

**Location:**
- Not detected.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
Not available in this repo.
```

## Test Types

**Unit Tests:**
- Not currently present.

**Integration Tests:**
- Not currently present.

**E2E Tests:**
- Not currently present.

## Current Validation

- `npm run compile` runs `tsc -p tsconfig.main.json` and a development webpack build.
- `npm run build` runs the production webpack build and copies `regedit` VBS assets into `dist/vbs`.
- `npm run dev` runs the TypeScript watcher, webpack dev build, and Electron launch sequence.
- Manual validation is the primary safety net; the repository guidance calls out smoke testing for login, import/export, and WebDriver-related behavior.
- Additional checks documented in `AGENTS.md` are `npx eslint src --ext .ts,.tsx` and `npx prettier --check "src/**/*.{ts,tsx,css}"`.

## High-Value Smoke Tests

- Electron startup and renderer load from `src/main.ts`, `src/preload.ts`, and `src/web/index.tsx`.
- Login flow in `src/main.ts` and `src/dqx-hiroba.ts`, including driver download and profile path creation.
- Export and import flows in `src/services/emote-manager.ts` and `src/services/emote-handlers.ts`.
- Clipboard and context-menu IPC in `src/main.ts`, `src/preload.ts`, and `src/web/App.tsx`.
- Security checks around path traversal and registry access in `src/security/secure-file-manager.ts`, `src/security/security-validator.ts`, and `src/driver_downloader.ts`.

## Gaps

- No automated tests are wired into `package.json`.
- No coverage threshold or report generation is configured.
- No mock strategy or fixture layer is defined for WebDriver, Electron IPC, or filesystem calls.
- Manual validation is required for browser interaction because the app depends on Microsoft Edge and Selenium WebDriver.

---

*Testing analysis: 2026-04-29*
