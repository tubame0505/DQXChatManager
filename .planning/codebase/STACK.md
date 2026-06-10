# Technology Stack

**Analysis Date:** 2026-04-29

## Languages

**Primary:**
- TypeScript 6.0.2 - application code in `src/*.ts`, `src/**/*.ts`, and renderer code in `src/web/*.tsx`

**Secondary:**
- CSS - renderer styling in `src/web/index.css` and `src/web/App.css`
- HTML - renderer shell in `src/web/index.html`
- Markdown - repo docs such as `README.md` and `src/deploy.md`

## Runtime

**Environment:**
- Electron desktop app
- Electron 41.2.0 in `package-lock.json` under `node_modules/electron`
- Node.js runtime requirements come from `selenium-webdriver` 4.43.0, which declares `node >= 20.0.0`

**Package Manager:**
- npm
- Lockfile present: `package-lock.json`

## Frameworks

**Core:**
- Electron - main process in `src/main.ts`, preload bridge in `src/preload.ts`
- React 19.2.5 - renderer entry in `src/web/index.tsx` and app component in `src/web/App.tsx`

**Testing:**
- Not detected - repository guidelines in `AGENTS.md` state there is no dedicated automated test suite yet

**Build/Dev:**
- webpack 5.106.2 - multi-target bundling in `webpack.config.mts`
- ts-loader 9.5.7 - TypeScript transpilation during webpack bundling
- TypeScript compiler 6.0.2 - main-process compilation via `tsconfig.main.json`
- html-webpack-plugin 5.6.6 - renders `src/web/index.html` into `dist/index.html`
- mini-css-extract-plugin 2.10.2 - extracts renderer CSS into `dist/app.css`
- electron-packager 17.1.2 - Windows packaging in `npm run buildwin`
- npm-run-all 4.1.5 - parallel dev scripts in `npm run dev`
- rimraf 6.1.3 - clears `dist/` before development start
- cross-env 10.1.0 - sets `NODE_ENV` and `NO_WATCH` across platforms

## Key Dependencies

**Critical:**
- selenium-webdriver 4.43.0 - automates Microsoft Edge against `https://hiroba.dqx.jp/sc/preference/emotemsg`
- regedit 5.1.4 - reads Windows registry values for Edge discovery in `src/driver_downloader.ts`
- compressing 2.1.1 - unpacks EdgeDriver ZIP archives into `dist/win64/...`
- react 19.2.5 and react-dom 19.2.5 - renderer UI runtime

**Infrastructure:**
- electron-reload 2.0.0-alpha.1 - present as a dev dependency
- cpx2 8.0.2 - copies `node_modules/regedit/vbs/*` into `dist/vbs`
- punycode 2.3.1 - present as a runtime dependency

## Configuration

**Environment:**
- `NODE_ENV` controls webpack mode and Electron startup behavior in `webpack.config.mts` and `src/main.ts`
- `NO_WATCH` disables webpack watch mode in `webpack.config.mts`
- Preload bridge is exposed through `contextBridge` in `src/preload.ts`
- Security-sensitive Electron defaults are set in `src/main.ts`: `contextIsolation: true`, `nodeIntegration: false`

**Build:**
- `webpack.config.mts` defines separate targets for `electron-main`, `electron-preload`, and `web`
- `tsconfig.json` compiles TypeScript to ES2020 modules for the shared source tree
- `tsconfig.main.json` emits CommonJS output to `dist/`
- `.eslintrc.js` and `.prettierrc.js` define lint/format rules

## Platform Requirements

**Development:**
- Windows is the primary operating environment for the Edge/registry/PowerShell integration path
- Microsoft Edge must be installed for browser automation
- The local build requires Node.js and npm

**Production:**
- Windows desktop application packaged with Electron
- `npm run buildwin` produces `packages/DQXChatManager-win32-x64/`

## Generated Outputs

**Build Artifacts:**
- `dist/` - compiled Electron main/preload bundles, renderer bundle, source maps, and copied VBS helpers
- `packages/` - packaged Windows application output from `electron-packager`
- `tsconfig.tsbuildinfo` - TypeScript incremental build metadata present at the repo root

**Runtime Generated Files:**
- `dist/vbs/` - copied from `node_modules/regedit/vbs/*` by `npm run build`
- `dist/win64/` - EdgeDriver download cache created by `src/driver_downloader.ts`

---

*Stack analysis: 2026-04-29*
