# Coding Conventions

**Analysis Date:** 2026-04-29

## Naming Patterns

**Files:**
- TypeScript modules use `camelCase` or descriptive kebab-style names already present in the repo, for example `src/driver_downloader.ts`, `src/webdriver-session.ts`, and `src/security/secure-file-manager.ts`.
- React files use component-oriented names such as `src/web/App.tsx` and `src/web/index.tsx`.

**Functions:**
- Functions and methods use `camelCase`, including arrow-function handlers such as `createWindow`, `setupIpcHandlers`, and `handleContextMenu` in `src/main.ts` and `src/web/App.tsx`.
- Static helper methods use descriptive verbs such as `safeCreateDirectory`, `normalizeForComparison`, and `selectOptionSafely`.

**Variables:**
- Local variables and refs use `camelCase`.
- Boolean flags use clear predicate names such as `isDev`, `noWatch`, and `hasSelection`.

**Types:**
- Classes and interfaces use `PascalCase`, for example `DqxHiroba`, `WebDriverSession`, `Logger`, and `IElectronAPI`.
- Literal unions and branded shapes are defined in `src/config/app-config.ts` and `src/@types/*.d.ts`.

## Code Style

**Formatting:**
- Prettier is configured in [`.prettierrc.js`](../../.prettierrc.js) with `tabWidth: 4`, `semi: true`, `singleQuote: false`, and `trailingComma: "es5"`.
- Source files follow 4-space indentation and semicolon-terminated statements.
- Webpack is configured in [`webpack.config.mts`](../../webpack.config.mts) to build separate main, preload, and renderer bundles with `ts-loader`, `css-loader`, `MiniCssExtractPlugin`, and `HtmlWebpackPlugin`.

**Linting:**
- ESLint is configured in [`.eslintrc.js`](../../.eslintrc.js) with `@typescript-eslint` and `prettier` integration.
- There is no repo-local lint script in `package.json`; the documented check is `npx eslint src --ext .ts,.tsx`.

## Import Organization

**Order:**
1. Node/Electron and third-party imports.
2. Local app imports from `./` or `../`.
3. Type-only declarations when needed.

**Path Aliases:**
- No path aliases are configured in `tsconfig.json`; imports are relative.

## Error Handling

**Patterns:**
- Domain errors are modeled as custom `Error` subclasses in `src/exceptions/emote-processing-exceptions.ts` and `src/security/security-validator.ts`.
- Callers generally throw typed errors for invalid state and catch them at IPC or orchestration boundaries in `src/main.ts` and `src/dqx-hiroba.ts`.
- Safe fallback helpers return `false`, `[]`, `""`, or `null` in utility code such as `src/utils/webdriver-utils.ts` and `src/security/secure-file-manager.ts`.

## Logging

**Framework:** `console` via `src/utils/logger.ts`.

**Patterns:**
- `ElectronLogger` mirrors messages to the renderer through `send_message` and also logs to `console.info`, `console.warn`, and `console.error`.
- Log messages are often Japanese user-facing strings in the app flow, while utility logs include bracketed levels such as `[INFO]` and `[ERROR]`.
- Security-related failures are logged explicitly, for example `SecurityError` handling in `src/main.ts`, `src/dqx-hiroba.ts`, and `src/driver_downloader.ts`.

## Comments

**When to Comment:**
- Comments are used sparingly for security-sensitive code, retry logic, and WebDriver handling.
- Many comments are Japanese explanatory notes around Electron security, clipboard/menu flows, and DOM automation steps.

**JSDoc/TSDoc:**
- JSDoc-style comments appear on helper methods and classes in `src/utils/webdriver-utils.ts`, `src/security/content-sanitizer.ts`, and `src/utils/xpath-selectors.ts`.

## Function Design

**Size:**
- Main-process handlers are split into small helpers rather than one large function, especially in `src/main.ts`, `src/dqx-hiroba.ts`, and `src/services/emote-handlers.ts`.

**Parameters:**
- IPC payloads are passed as explicit object shapes or primitive arguments.
- Security-sensitive helpers accept an `allowedBasePath` parameter and validate resolved paths before filesystem access in `src/security/secure-file-manager.ts`.

**Return Values:**
- Async orchestration methods usually return `Promise<void>`, `Promise<ProcessingResult>`, or `Promise<boolean>`.
- Utility methods often return safe fallbacks instead of throwing when the failure is expected and recoverable.

## Module Design

**Exports:**
- Modules generally export classes, interfaces, and constants directly rather than using barrel files.
- Shared config lives in `src/config/app-config.ts`; shared declarations live in `src/@types/*.d.ts`.

**Barrel Files:**
- Not detected.

## Repo-Specific Guidance

- Follow `AGENTS.md`: do not edit generated output in `dist/` or `packages/` by hand, keep Electron security defaults intact, and run `npm run compile` and `npm run build` before PRs.
- Keep Electron security settings in `src/main.ts` intact: `contextIsolation: true` and `nodeIntegration: false`.
- Do not edit generated output in `dist/` or `packages/` by hand.
- Follow the existing `src/web/App.tsx` React pattern of a single root component with local state and `window.myAPI` bridge calls.

---

*Convention analysis: 2026-04-29*
