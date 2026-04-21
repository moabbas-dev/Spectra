# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spectra is a desktop OpenAPI/Swagger editor built with Electron and React. It provides a VS Code-like workflow for creating, editing, validating, previewing, and versioning API specifications.

## Dev Commands

```bash
npm run dev          # Start Vite dev server + Electron (concurrent)
npm run dev:vite     # Start Vite only (renderer on port 5173)
npm run dev:electron # Start Electron only (waits for Vite)
npm run build        # Build renderer (Vite) + compile Electron TypeScript
npm run build:electron  # Compile Electron TypeScript only
npm run dist         # Build and package with electron-builder
npm run typecheck    # TypeScript checks for both renderer and Electron
npm run rebuild:native  # Rebuild better-sqlite3 native module for Electron
```

**Native modules:** better-sqlite3 requires rebuilding when Electron version changes (`npm run rebuild:native`). The `postinstall` hook runs this automatically after `npm install`.

## Architecture

### Process Model

- **Electron main process** (`electron/`): Owns database lifecycle, filesystem operations, and all IPC registration. Runs SQLite via better-sqlite3.
- **Renderer process** (`src/`): React 18 application. Communicates with main via typed IPC channels exposed through a preload script.
- **Preload** (`electron/preload.ts`): Uses `contextBridge` to expose a restricted `spectra.invoke()` API to the renderer. Only channels listed in `shared/ipc-channels.ts` are allowed.

### IPC System

All IPC channels are defined in `shared/ipc-channels.ts` and implemented in `electron/ipc/`. Each domain has its own file (e.g., `spec.ipc.ts`, `project.ipc.ts`). The `electron/ipc/index.ts` registers all handlers via a `registerAllIpc()` function that receives the database instance and a typed `handle()` wrapper.

Key IPC namespaces: `workspace:*`, `project:*`, `folder:*`, `spec-file:*`, `spec:*`, `version:*`, `fs:*`, `git:*`, `validate:*`, `settings:*`.

### Database

- SQLite via **better-sqlite3** (native module, WAL mode, foreign keys enabled)
- Database file: `{userData}/spectra-data/spectra.db`
- Schema managed via SQL migration files in `electron/db/migrations/`
- Repositories in `electron/db/repositories/` (e.g., `project.repo.ts`, `workspace.repo.ts`) handle all DB access from IPC handlers

### State Management (Renderer)

Zustand stores in `src/stores/`:
- `editor.store.ts` — open tabs, active tab, dirty state, active view (code/form/preview/history/validate)
- `projects.store.ts` — workspace/project/folder tree state
- `ui.store.ts` — sidebar, bottom panel, activity bar UI state
- `workspace.store.ts` — active workspace
- `validation.store.ts` — validation problems/results

### Editor Views

The editor area supports 5 views switched per-tab via `EditorViewSwitcher`:
- **code** — Monaco Editor with YAML syntax + OpenAPI completions
- **form** — structured form-based editing (paths, schemas, operations, etc.)
- **preview** — Swagger UI React rendered preview
- **history** — version snapshots, restore, diff
- **validate** — validation results panel

### Shared Types

`shared/ipc-payloads.ts` defines all input/output types for IPC calls. `shared/constants.ts` holds shared constants.

### Paths

- `@shared` alias maps to project root's `shared/` directory (configured in `vite.config.ts`)
- Electron compiled to `dist-electron/`
- Renderer built to `dist/`
- Electron migrations copied to `dist-electron/electron/db/migrations/` at build time via a post-build `cp` command
