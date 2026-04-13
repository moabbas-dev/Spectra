# Spectra

Desktop OpenAPI and Swagger editor built with Electron and React.  
Spectra helps API teams create, edit, validate, preview, and version API specifications with a VS Code-like workflow.

## Why Spectra

Writing large OpenAPI files by hand is slow and error-prone. Spectra provides:

- A workspace and project model for organizing API specs
- A form editor for structured spec authoring
- A Monaco YAML editor for direct control
- Live Swagger UI preview
- Realtime validation and problems panel
- Version snapshots with restore and diff
- Import and export flows for spec files

## Current Product Status

Implemented and usable now:

- Workspace, project, folder, and spec file management
- Multi-tab editing with crash recovery
- Code, Form, Preview, and History editor modes
- YAML formatting and OpenAPI-aware completions
- Realtime validation with errors, warnings, and hints
- Version history, snapshot creation, restore, and visual diff
- Quick Open, Command Palette, autosave, and keyboard shortcuts

Partially implemented or placeholder:

- Git and GitHub sync handlers exist but are not implemented
- Workspace export/import and full app data export/import are wired in UI but currently placeholder dialogs

## Tech Stack

- Electron 28+
- React 18
- TypeScript strict mode
- Vite
- TailwindCSS v3
- SQLite (better-sqlite3)
- Monaco Editor
- Swagger UI React
- js-yaml
- Zustand

## Main Features

- Workspaces and projects:
  - Create multiple workspaces and projects
  - Persist workspace and project metadata in SQLite
- Tree management:
  - Create, rename, move, and delete folders and spec files
  - File-system and database state kept in sync
- Editing modes:
  - Form view for structured editing
  - Code view for full YAML editing
  - Preview view for rendered Swagger docs
  - History view for version operations
- Reliability:
  - Tab/session restoration
  - Dirty-tab crash recovery persistence
  - Autosave loop
- Validation:
  - YAML parsing checks
  - OpenAPI structural checks
  - Duplicate operationId checks
  - Problems surfaced in bottom panel and Monaco markers
- Versioning:
  - Manual snapshot creation
  - Restore with safety snapshot
  - Side-by-side diff viewer

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- Windows, macOS, or Linux

### Install

    npm install

### Run in Development

    npm run dev

This starts Vite and Electron together.

### Build

    npm run build

### Package

    npm run dist

## Useful Scripts

- npm run dev  
  Start renderer and Electron in development mode

- npm run typecheck  
  Run TypeScript checks for renderer and Electron code

- npm run build  
  Build renderer and Electron output

- npm run dist  
  Build and package application with electron-builder

- npm run rebuild:native  
  Rebuild native modules for Electron

## Keyboard Shortcuts

- Ctrl+S: Save active file
- Ctrl+P: Quick Open
- Ctrl+Shift+P: Command Palette
- Ctrl+W: Close active tab
- Ctrl+B: Toggle sidebar
- Ctrl+J: Toggle bottom panel
- Ctrl+Shift+E: Focus Explorer
- Ctrl+Shift+F: Focus Search
- Ctrl+,: Open Settings

## Architecture Summary

- Electron main process:
  - Owns DB lifecycle, migrations, and IPC registration
  - Handles filesystem operations and secure IPC boundaries

- Renderer process:
  - React application with Zustand stores
  - VS Code-like shell with activity bar, sidebar, editor area, and status/bottom panels

- Shared contract:
  - Typed IPC channels and payloads shared between main and renderer

## Data and Persistence

- SQLite database stores:
  - workspaces
  - projects
  - folders
  - spec files
  - spec versions
  - user settings
- Spec documents are stored on disk in workspace project folders
- Database tracks metadata, relationships, and history snapshots

## Known Limitations

- Git integration UI exists, but backend handlers are currently stubs
- Workspace-level and whole-app import/export are not fully implemented yet
- Validation currently uses internal rule checks, not full Spectral ruleset execution pipeline

## Roadmap Ideas

- Complete Git and GitHub sync flows
- Implement full workspace and app-data backup/restore
- Add collaborative workflows and conflict resolution UX
- Extend validation with configurable rulesets and richer diagnostics

## License

MIT
