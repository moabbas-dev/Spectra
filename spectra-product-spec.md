# Spectra — Production Application Specification

> **Spectra** *(noun)* — the full visible range of light, broken into its component parts. Like a prism revealing what's hidden inside a beam, Spectra reveals the structure, shape, and clarity of your APIs.

---

## Overview

You are a **senior product architect and full-stack desktop engineer**. Design and build **Spectra**, a production-grade desktop application for creating, editing, validating, versioning, and synchronizing Swagger/OpenAPI specification files. The app must feel and perform like **VS Code** in structure, responsiveness, and workflow polish.

**Tech Stack (Non-negotiable):**
- **Electron.js** (v28+) — main process, OS integration, file system
- **TypeScript** (strict mode) — everywhere, no `any` escapes
- **React 18** — renderer process UI
- **TailwindCSS v3** — all styling, no raw CSS except for third-party overrides
- **Vite** — bundler for renderer
- **electron-builder** — packaging and distribution

---

## Goal

Build a **professional, production-ready desktop tool** for backend teams and API designers to manage OpenAPI/Swagger specs visually — without writing YAML manually from scratch — while retaining **full code visibility, control, and Git integration**. The tool must be reliable enough to be used daily by engineering teams in large organizations.

---

## Core User Flows

The application must support the following complete workflows:

1. **Create** a workspace → create projects → create folders → create Swagger/OpenAPI files
2. **Edit** specs via a structured form editor that generates YAML automatically
3. **View** raw YAML/JSON code in a syntax-highlighted editor (Monaco)
4. **Preview** the rendered Swagger UI live
5. **Validate** files automatically with real-time error and warning detection
6. **Import** existing YAML/JSON spec files or entire project structures
7. **Export** individual files or full projects with folder structure preserved
8. **Link** individual files or full projects to GitHub repositories
9. **Sync** — push to and pull from GitHub with conflict awareness
10. **Version** every spec file with history, comparison, diff, and restore
11. **Collaborate** via shared workspace exports and Git-backed state

---

## Technology Stack — Complete

| Layer | Technology |
|---|---|
| Desktop shell | Electron 28+ |
| Frontend framework | React 18 + TypeScript (strict) |
| Styling | TailwindCSS v3 |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| YAML parsing | `js-yaml` + `yaml` (for round-trip preservation) |
| JSON Schema validation | `ajv` + official OpenAPI meta-schemas |
| OpenAPI validation | `@stoplight/spectral-core` + rulesets |
| Swagger UI preview | `swagger-ui-react` |
| Local database | `better-sqlite3` (via Electron main process) |
| GitHub integration | `@octokit/rest` + `simple-git` |
| IPC bridge | Electron contextBridge + typed IPC channels |
| State management | Zustand (lightweight, TypeScript-native) |
| Form management | React Hook Form + Zod validation |
| Diff viewer | `react-diff-viewer-continued` |
| App updates | `electron-updater` (auto-update support) |
| Logging | `electron-log` |
| Packaging | `electron-builder` (Windows, macOS, Linux) |
| Testing | Vitest (unit), Playwright (E2E) |

---

## Application Architecture

### Process Architecture

```
┌─────────────────────────────────────────────┐
│              Electron Main Process           │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │ File System │  │   SQLite Database    │ │
│  │   Manager   │  │  (better-sqlite3)    │ │
│  └─────────────┘  └──────────────────────┘ │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Git/GitHub │  │   IPC Handler Layer  │ │
│  │   Service   │  │  (typed channels)    │ │
│  └─────────────┘  └──────────────────────┘ │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Validation │  │   Auto-updater       │ │
│  │   Engine    │  │   electron-updater   │ │
│  └─────────────┘  └──────────────────────┘ │
└───────────────────────┬─────────────────────┘
                        │ contextBridge IPC
┌───────────────────────▼─────────────────────┐
│             Electron Renderer Process        │
│                 (React + Vite)               │
│                                             │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ │
│  │ Sidebar  │ │  Editor    │ │  Bottom   │ │
│  │  Panel   │ │  Tabs Area │ │  Panel    │ │
│  └──────────┘ └────────────┘ └───────────┘ │
│         ┌──────────────────────┐            │
│         │    Zustand Stores    │            │
│         └──────────────────────┘            │
└─────────────────────────────────────────────┘
```

### IPC Channel Design (Typed)

All IPC communication must be **fully typed** with shared interfaces in a `shared/` directory accessible by both processes.

```typescript
// shared/ipc-channels.ts
export const IPC = {
  // File system
  FS_READ_FILE: 'fs:read-file',
  FS_WRITE_FILE: 'fs:write-file',
  FS_DELETE_FILE: 'fs:delete-file',
  FS_RENAME: 'fs:rename',

  // Projects
  PROJECT_CREATE: 'project:create',
  PROJECT_LIST: 'project:list',
  PROJECT_DELETE: 'project:delete',
  PROJECT_EXPORT: 'project:export',
  PROJECT_IMPORT: 'project:import',

  // Spec files
  SPEC_SAVE: 'spec:save',
  SPEC_VALIDATE: 'spec:validate',
  SPEC_FORMAT: 'spec:format',
  SPEC_DUPLICATE: 'spec:duplicate',

  // Versions
  VERSION_CREATE: 'version:create',
  VERSION_LIST: 'version:list',
  VERSION_RESTORE: 'version:restore',
  VERSION_DIFF: 'version:diff',

  // GitHub
  GIT_AUTH: 'git:auth',
  GIT_LINK: 'git:link',
  GIT_PULL: 'git:pull',
  GIT_PUSH: 'git:push',
  GIT_STATUS: 'git:status',
  GIT_DIFF: 'git:diff',

  // Validation
  VALIDATE_SPEC: 'validate:spec',
  VALIDATE_REALTIME: 'validate:realtime',
} as const;
```

---

## Database Schema (SQLite via `better-sqlite3`)

```sql
-- Workspaces
CREATE TABLE workspaces (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT,
  root_path   TEXT    NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  settings    TEXT    NOT NULL DEFAULT '{}'  -- JSON blob
);

-- Projects (inside a workspace)
CREATE TABLE projects (
  id           TEXT    PRIMARY KEY,
  workspace_id TEXT    NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  description  TEXT,
  color        TEXT,   -- hex color for sidebar label
  icon         TEXT,   -- icon name
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  UNIQUE(workspace_id, name)
);

-- Folders (nested, self-referencing)
CREATE TABLE folders (
  id               TEXT    PRIMARY KEY,
  project_id       TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_folder_id TEXT    REFERENCES folders(id) ON DELETE CASCADE,
  name             TEXT    NOT NULL,
  path             TEXT    NOT NULL,  -- relative path from project root
  created_at       INTEGER NOT NULL
);

-- Spec files
CREATE TABLE spec_files (
  id                TEXT    PRIMARY KEY,
  project_id        TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id         TEXT    REFERENCES folders(id) ON DELETE SET NULL,
  name              TEXT    NOT NULL,
  file_path         TEXT    NOT NULL,       -- absolute path on disk
  openapi_version   TEXT    NOT NULL,       -- '2.0' | '3.0' | '3.1'
  status            TEXT    NOT NULL DEFAULT 'draft', -- 'draft'|'validated'|'published'
  is_favorite       INTEGER NOT NULL DEFAULT 0,
  last_validated_at INTEGER,
  validation_status TEXT,                   -- 'valid'|'warning'|'error'|null
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

-- Version history per spec file
CREATE TABLE spec_versions (
  id             TEXT    PRIMARY KEY,
  spec_file_id   TEXT    NOT NULL REFERENCES spec_files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label  TEXT,                -- e.g. 'v1.0.0', 'before-auth-refactor'
  content        TEXT    NOT NULL,    -- full YAML/JSON snapshot
  content_hash   TEXT    NOT NULL,    -- SHA-256 of content
  change_summary TEXT,                -- auto-generated or user-written
  created_at     INTEGER NOT NULL,
  created_by     TEXT    DEFAULT 'local', -- 'local' | github username
  UNIQUE(spec_file_id, version_number)
);

-- GitHub link per spec file or project
CREATE TABLE github_links (
  id           TEXT    PRIMARY KEY,
  entity_type  TEXT    NOT NULL,   -- 'spec_file' | 'project'
  entity_id    TEXT    NOT NULL,
  repo_owner   TEXT    NOT NULL,
  repo_name    TEXT    NOT NULL,
  branch       TEXT    NOT NULL DEFAULT 'main',
  file_path    TEXT,               -- null for project-level links
  last_synced_at INTEGER,
  sync_status  TEXT,               -- 'synced'|'ahead'|'behind'|'conflict'|'unknown'
  remote_sha   TEXT,               -- last known remote file SHA
  created_at   INTEGER NOT NULL
);

-- Validation results (cached per file per version)
CREATE TABLE validation_results (
  id              TEXT    PRIMARY KEY,
  spec_file_id    TEXT    NOT NULL REFERENCES spec_files(id) ON DELETE CASCADE,
  spec_version_id TEXT    REFERENCES spec_versions(id) ON DELETE SET NULL,
  run_at          INTEGER NOT NULL,
  total_errors    INTEGER NOT NULL DEFAULT 0,
  total_warnings  INTEGER NOT NULL DEFAULT 0,
  total_hints     INTEGER NOT NULL DEFAULT 0,
  results         TEXT    NOT NULL  -- JSON array of ValidationIssue[]
);

-- User settings and preferences
CREATE TABLE user_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL  -- JSON
);

-- Audit log
CREATE TABLE audit_log (
  id          TEXT    PRIMARY KEY,
  action      TEXT    NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  payload     TEXT,   -- JSON
  created_at  INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_spec_files_project       ON spec_files(project_id);
CREATE INDEX idx_spec_files_folder        ON spec_files(folder_id);
CREATE INDEX idx_spec_versions_file       ON spec_versions(spec_file_id);
CREATE INDEX idx_github_links_entity      ON github_links(entity_type, entity_id);
CREATE INDEX idx_validation_results_file  ON validation_results(spec_file_id);
```

---

## Folder / File Structure

```
spectra/
├── electron/
│   ├── main.ts                    # Electron main entry
│   ├── preload.ts                 # contextBridge exposures
│   ├── ipc/
│   │   ├── index.ts               # IPC router
│   │   ├── project.ipc.ts
│   │   ├── spec.ipc.ts
│   │   ├── git.ipc.ts
│   │   ├── version.ipc.ts
│   │   └── validation.ipc.ts
│   ├── services/
│   │   ├── database.service.ts    # SQLite setup + migrations
│   │   ├── file-system.service.ts # Read/write/watch files
│   │   ├── github.service.ts      # Octokit + simple-git
│   │   ├── validation.service.ts  # Spectral + AJV engine
│   │   ├── version.service.ts     # Snapshot + diff logic
│   │   ├── export.service.ts      # Project export (zip)
│   │   ├── import.service.ts      # Import + detect format
│   │   └── update.service.ts      # electron-updater
│   ├── db/
│   │   ├── schema.sql
│   │   ├── migrations/
│   │   │   ├── 001_initial.sql
│   │   │   └── 002_github_links.sql
│   │   └── repositories/
│   │       ├── workspace.repo.ts
│   │       ├── project.repo.ts
│   │       ├── spec-file.repo.ts
│   │       ├── version.repo.ts
│   │       ├── github-link.repo.ts
│   │       └── validation.repo.ts
│   └── utils/
│       ├── yaml.util.ts
│       ├── hash.util.ts
│       └── logger.util.ts
│
├── src/                           # Renderer (React)
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                  # Tailwind directives only
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # Root layout (sidebar + main + bottom)
│   │   │   ├── Sidebar.tsx        # Collapsible left panel
│   │   │   ├── MainArea.tsx       # Tab container
│   │   │   ├── BottomPanel.tsx    # Terminal/logs/validation
│   │   │   └── StatusBar.tsx      # VS Code-style bottom status bar
│   │   │
│   │   ├── sidebar/
│   │   │   ├── WorkspaceSelector.tsx
│   │   │   ├── ProjectTree.tsx    # Recursive tree with drag support
│   │   │   ├── TreeNode.tsx       # File/folder node with icons
│   │   │   ├── ContextMenu.tsx    # Right-click actions
│   │   │   ├── GitStatusBadge.tsx # Indicators (M, U, C, etc.)
│   │   │   ├── SearchPanel.tsx    # Global search across files
│   │   │   ├── FavoritesPanel.tsx
│   │   │   └── SidebarTabs.tsx    # Explorer/Search/Git/Extensions
│   │   │
│   │   ├── editor/
│   │   │   ├── EditorTabs.tsx          # Tab bar with close/dirty indicators
│   │   │   ├── EditorTabPanel.tsx      # Single tab content switcher
│   │   │   ├── views/
│   │   │   │   ├── FormEditorView.tsx
│   │   │   │   ├── CodeEditorView.tsx
│   │   │   │   ├── SwaggerUIView.tsx
│   │   │   │   ├── VersionHistoryView.tsx
│   │   │   │   └── ValidationView.tsx
│   │   │   └── EditorViewSwitcher.tsx
│   │   │
│   │   ├── form-editor/
│   │   │   ├── FormEditor.tsx
│   │   │   ├── sections/
│   │   │   │   ├── InfoSection.tsx
│   │   │   │   ├── ServersSection.tsx
│   │   │   │   ├── PathsSection.tsx
│   │   │   │   ├── PathItem.tsx
│   │   │   │   ├── OperationForm.tsx
│   │   │   │   ├── ParametersForm.tsx
│   │   │   │   ├── RequestBodyForm.tsx
│   │   │   │   ├── ResponsesForm.tsx
│   │   │   │   ├── ComponentsSection.tsx
│   │   │   │   ├── SchemasForm.tsx
│   │   │   │   ├── SecuritySection.tsx
│   │   │   │   └── TagsSection.tsx
│   │   │   ├── fields/
│   │   │   │   ├── SchemaFieldBuilder.tsx
│   │   │   │   ├── RefPicker.tsx
│   │   │   │   ├── MediaTypeEditor.tsx
│   │   │   │   ├── ExampleEditor.tsx
│   │   │   │   └── ExtensionEditor.tsx
│   │   │   └── templates/
│   │   │       ├── TemplateLibrary.tsx
│   │   │       └── endpoint-templates/
│   │   │           ├── crud.template.ts
│   │   │           ├── auth.template.ts
│   │   │           ├── pagination.template.ts
│   │   │           └── webhook.template.ts
│   │   │
│   │   ├── bottom-panel/
│   │   │   ├── BottomPanelTabs.tsx
│   │   │   ├── ProblemsPanel.tsx
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── GitLogPanel.tsx
│   │   │   └── TerminalPanel.tsx
│   │   │
│   │   ├── version/
│   │   │   ├── VersionTimeline.tsx
│   │   │   ├── VersionCard.tsx
│   │   │   ├── VersionDiffViewer.tsx
│   │   │   └── CreateVersionModal.tsx
│   │   │
│   │   ├── github/
│   │   │   ├── GitHubAuthModal.tsx
│   │   │   ├── LinkRepoModal.tsx
│   │   │   ├── SyncPanel.tsx
│   │   │   ├── ConflictResolutionModal.tsx
│   │   │   └── GitStatusIndicator.tsx
│   │   │
│   │   ├── dialogs/
│   │   │   ├── CreateProjectDialog.tsx
│   │   │   ├── CreateFileDialog.tsx
│   │   │   ├── CreateFolderDialog.tsx
│   │   │   ├── ImportDialog.tsx
│   │   │   ├── ExportDialog.tsx
│   │   │   ├── RenameDialog.tsx
│   │   │   ├── DeleteConfirmDialog.tsx
│   │   │   ├── MigrationDialog.tsx
│   │   │   └── SettingsDialog.tsx
│   │   │
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Tooltip.tsx
│   │       ├── Modal.tsx
│   │       ├── Spinner.tsx
│   │       ├── Toast.tsx
│   │       ├── DropdownMenu.tsx
│   │       ├── Kbd.tsx
│   │       ├── EmptyState.tsx
│   │       └── CodeBlock.tsx
│   │
│   ├── stores/
│   │   ├── workspace.store.ts
│   │   ├── projects.store.ts
│   │   ├── editor.store.ts
│   │   ├── validation.store.ts
│   │   ├── git.store.ts
│   │   └── ui.store.ts
│   │
│   ├── hooks/
│   │   ├── useIPC.ts
│   │   ├── useEditor.ts
│   │   ├── useValidation.ts
│   │   ├── useGit.ts
│   │   ├── useVersions.ts
│   │   ├── useContextMenu.ts
│   │   ├── useAutoSave.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useDragAndDrop.ts
│   │
│   ├── utils/
│   │   ├── yaml.util.ts
│   │   ├── openapi.util.ts
│   │   ├── diff.util.ts
│   │   └── format.util.ts
│   │
│   └── types/
│       ├── openapi.types.ts
│       ├── project.types.ts
│       ├── editor.types.ts
│       ├── validation.types.ts
│       ├── git.types.ts
│       └── version.types.ts
│
├── shared/
│   ├── ipc-channels.ts
│   ├── ipc-payloads.ts
│   └── constants.ts
│
├── assets/
│   ├── icons/
│   └── images/
│
├── tests/
│   ├── unit/
│   │   ├── validation.service.test.ts
│   │   ├── yaml.util.test.ts
│   │   └── version.service.test.ts
│   └── e2e/
│       ├── project.spec.ts
│       ├── editor.spec.ts
│       └── git.spec.ts
│
├── electron-builder.yml
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.electron.json
└── package.json
```

---

## UI Layout Design

### Global Layout (VS Code mirroring)

```
┌─────────────────────────────────────────────────────────────────┐
│  Title Bar  [Spectra]  [Menu: File  Edit  View  Git  Help] [─□✕]│
├────┬────────────────────────────────────────────────────────────┤
│Act │ Sidebar                  │  Main Editor Area               │
│iv- │ ┌───────────────────┐   │ ┌─────────────────────────────┐ │
│ity │ │ WORKSPACE         │   │ │ [tabs: file1.yaml × | file2]│ │
│Bar │ │ ▼ my-project      │   │ ├─────────────────────────────┤ │
│    │ │   ▶ auth/         │   │ │ [Form|Code|Preview|History| │ │
│    │ │   ▼ users/        │   │ │  Validate]                  │ │
│    │ │     users.yaml  ⚠ │   │ │                             │ │
│    │ │     admin.yaml  ✓ │   │ │   [Active View Content]     │ │
│    │ │   ▶ payments/     │   │ │                             │ │
│    │ │ ▼ api-v2/         │   │ │                             │ │
│    │ │   openapi.yaml    │   │ │                             │ │
│    │ └───────────────────┘   │ └─────────────────────────────┘ │
├────┴─────────────────────────┴─────────────────────────────────┤
│ Bottom Panel  [Problems 3⚠ 1✗] [Output] [Git Log] [Terminal]   │
│ ✗ Missing 'description' in POST /users/create — line 42         │
│ ⚠ Unused schema 'LegacyPayload' in components                   │
│ ⚠ operationId 'getUser' is duplicated across 2 paths            │
├─────────────────────────────────────────────────────────────────┤
│ Status Bar: OAS 3.1 │ users.yaml │ Synced ✓ │ v12 │ YAML │ UTF-8│
└─────────────────────────────────────────────────────────────────┘
```

### Activity Bar (leftmost strip)

Icons only with tooltips:

| Icon | Panel |
|---|---|
| 📁 | **Explorer** — project tree |
| 🔍 | **Search** — global full-text search |
| 🔀 | **Source Control** — GitHub sync status |
| 🕐 | **History** — recent files and version activity |
| ⭐ | **Favorites** — pinned files |
| ⚙️ | **Settings** |

### Sidebar Panels

**Explorer panel** features:
- Workspace switcher dropdown at top
- Project tree with recursive folder/file nodes
- Git status badges (M = modified, U = untracked, C = conflict, ↑ = ahead, ↓ = behind)
- Validation status icons (✓ valid, ⚠ warnings, ✗ errors)
- Drag-and-drop reordering
- Inline rename on double-click
- Collapse/expand all toggle

**Search panel** features:
- Full-text search across all YAML content in the workspace
- Filter by: project, version, validation status, OpenAPI version
- Results show file + line number + context snippet
- Click result to open file at that line in Monaco

### Tab System (Main Area)

- Tabs persist across sessions (rehydrated from store on launch)
- Dirty state indicator (dot on tab when unsaved)
- Tab context menu: Close, Close Others, Close All, Reveal in Sidebar, Copy Path
- Drag-to-reorder tabs
- Overflow scroll when many tabs are open
- Pinned tabs (remain open, don't close on "Close Others")

### Editor View Switcher

Each open file shows these view tabs below the main tab bar:

```
[📝 Form]  [</> Code]  [👁 Preview]  [🕐 History]  [✓ Validate]
```

| View | Description |
|---|---|
| **Form** | Structured form editor, always in sync with YAML |
| **Code** | Monaco editor with YAML syntax highlighting, autocomplete, and inline error markers |
| **Preview** | Embedded `swagger-ui-react` with live re-render on change |
| **History** | Version timeline + diff viewer |
| **Validate** | Detailed validation results for this file |

---

## Feature Breakdown

### Phase 1 — Production Foundation

All of these must be **production-quality**, not prototypes.

#### Project & Workspace Management

- Create, rename, delete workspaces and projects
- Create folders (nested, unlimited depth)
- Create new Swagger/OpenAPI files (2.0, 3.0, 3.1) from blank or from template
- Persistent storage in SQLite
- Auto-detect OpenAPI version from file content on import
- Multi-workspace support with fast switching

#### Form-Based Editor

Full structured form covering all OpenAPI sections:

- `info` — title, version, description, contact, license, termsOfService
- `servers` — url, description, variables
- `paths` — add/edit/delete endpoints per HTTP method
- `parameters` — path, query, header, cookie (per operation and per path)
- `requestBody` — content types, schema, required flag, examples
- `responses` — status codes, descriptions, content, headers, links
- `components` — schemas, responses, parameters, examples, requestBodies, headers, securitySchemes, links, callbacks
- `security` — global and per-operation
- `tags` — name, description, externalDocs
- `externalDocs`
- `x-` extensions — custom key-value editor

Additional form features:
- Recursive schema builder (nested objects, arrays, $ref picker, allOf/anyOf/oneOf/not)
- All changes in form update the YAML in real-time via debounced serialization

#### Code Editor (Monaco)

- Syntax highlighting for YAML and JSON
- JSON Schema-based IntelliSense and autocomplete for OpenAPI keywords
- Inline error and warning markers (from validation engine)
- Format document (Prettier-formatted YAML)
- Breadcrumb path display
- Find and Replace
- Minimap
- Go to line
- Code folding on all levels
- Bidirectional sync: changes in Monaco update the form state (parsed and mapped)

> **Note on bidirectional sync:** YAML-to-form sync is best-effort. If the user writes advanced YAML constructs that the form cannot represent (e.g. complex anchors, unusual $ref patterns), the form shows an **"Advanced YAML — form editing limited"** banner and the code editor remains the primary editing surface. This is the correct behavior and must be clearly communicated to the user.

#### Validation Engine

Run on: file open, file save, manual trigger, and debounced on code change (500ms).

Uses `@stoplight/spectral-core` with bundled OpenAPI rulesets, augmented with custom Spectra rules:

- Duplicate `operationId` detection
- Unused `components/schemas` detection
- Missing `description` on operations, parameters, schemas
- Missing `summary` on operations
- Weak naming conventions (e.g. operationIds like `operation1`)
- Invalid HTTP status codes
- Inconsistent parameter types across operations
- Broken `$ref` pointers
- Circular reference detection (warn but not block)
- Version-specific rule violations (e.g. `basePath` is Swagger 2.0 only)

Results displayed in:
- Bottom panel Problems tab (all files)
- Validation view tab (per file)
- Monaco inline markers (squiggly lines + hover tooltip)
- File tree status icons
- Status bar count

#### Import / Export

- Import YAML or JSON OpenAPI files (single file)
- Import a folder/zip of spec files preserving folder structure
- Auto-detect OpenAPI version on import
- Export single file as YAML or JSON
- Export project as zip (preserving folder structure)
- Export with validation gate: warn if exporting files with errors
- Round-trip guarantee: import → edit → export must not corrupt YAML structure, comments, or ordering where possible (use `yaml` library with round-trip mode)

#### Autosave & Recovery

- Autosave every 30 seconds (configurable)
- Dirty-state tracking per file
- Crash recovery: on launch, detect any unsaved dirty state and offer restore
- Save indicator in status bar

#### Keyboard Shortcuts

Full keyboard shortcut system (VS Code-compatible where possible):

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd+S` | Save |
| `Ctrl/Cmd+Shift+P` | Command Palette |
| `Ctrl/Cmd+P` | Quick Open file |
| `Ctrl/Cmd+W` | Close tab |
| `Ctrl/Cmd+Shift+E` | Focus Explorer |
| `Ctrl/Cmd+Shift+F` | Focus Search |
| `Ctrl/Cmd+Shift+G` | Focus Git panel |
| `Ctrl/Cmd+B` | Toggle sidebar |
| `Ctrl/Cmd+J` | Toggle bottom panel |

#### Right-Click Context Menu — File

```
Open
Open to the Side
─────────────────────────
Edit in Form
View YAML Code
View Swagger UI Preview
─────────────────────────
Validate File
Format YAML
─────────────────────────
Import from File...
Export File...
Export as JSON
─────────────────────────
Link to GitHub Repo...
Refresh from GitHub
Commit & Push to GitHub
View GitHub Diff
─────────────────────────
Create Version...
View Version History
Compare Versions...
Restore Version...
─────────────────────────
Add to Favorites
─────────────────────────
Duplicate
Rename
Copy Path
─────────────────────────
Delete
```

#### Right-Click Context Menu — Folder

```
New File...
New Folder...
─────────────────────────
Import File into Folder...
Export Folder...
─────────────────────────
Rename
Copy Path
─────────────────────────
Delete
```

---

### Phase 2 — Git Integration & Versioning

#### GitHub Integration

- **Authentication:** GitHub OAuth App or Personal Access Token (PAT). Store securely in OS keychain via `keytar`. Never stored in plaintext in SQLite.
- **Link a file:** Connect a spec file to a specific file in a GitHub repo (owner/repo/branch/filepath)
- **Link a project:** Connect a project to a GitHub repo (owner/repo/branch/root folder)
- **Pull from GitHub:** Fetch remote file content, compare with local, show diff, offer merge or overwrite
- **Push to GitHub:** Commit updated YAML to remote with a user-provided or auto-generated commit message
- **Refresh status:** Check if local is ahead/behind/in-conflict with remote (using SHA comparison)
- **Conflict resolution:** Show a 3-panel diff (local / base / remote) with accept-local, accept-remote, or manual merge options
- **Git log:** Show commit history for the linked file directly in the app
- **Multi-file push:** Support pushing multiple changed files in a project in one commit
- **Branch management:** Switch branches, create new branches, basic branch listing
- **Status indicators:** Show per-file Git status in the sidebar tree at all times (polling or webhook-based refresh)

#### Versioning System

Every **Save** action optionally creates a version snapshot (user configures: always / ask / never).
Every **Push to GitHub** always creates a version snapshot automatically.
Every **Restore** creates a new version before restoring (non-destructive).

**Version data stored:**
- Incrementing integer version number
- Optional human-readable label (e.g. `v2.0-auth-overhaul`)
- Full YAML content snapshot
- SHA-256 hash of content
- Auto-generated change summary (line count delta + section change detection)
- Timestamp + author (local or GitHub username)

**Version History View:**
- Timeline visualization with version cards
- Each card shows: version number, label, timestamp, author, change summary, error/warning count at time of snapshot
- Click to preview content of that version
- Restore button (creates new version first)
- Delete version (with confirmation)

**Version Comparison:**
- Select any two versions → side-by-side diff viewer
- Diff viewer highlights additions (green), deletions (red), unchanged (gray)
- Inline diff mode also available
- Export diff as patch file

---

### Phase 3 — Advanced Features

#### Command Palette

- `Ctrl/Cmd+Shift+P` opens a VS Code-style command palette
- Searchable list of all actions
- Recent commands shown at top

#### Templates Library

Built-in endpoint templates:
- CRUD (Create/Read/Update/Delete) for a resource
- Authentication endpoints (login, logout, refresh token, register)
- Paginated list endpoint
- File upload endpoint
- Webhook event endpoint
- Health check endpoint
- GraphQL-over-REST pattern

Templates generate pre-filled form sections. Users can create and save custom templates from existing operations.

#### Version Migration Assistant

- Detect file version and offer to migrate:
  - Swagger 2.0 → OpenAPI 3.0
  - OpenAPI 3.0 → OpenAPI 3.1
- Show migration diff preview before applying
- Flag fields that have no equivalent in the target version
- Generate a migration report

#### Auto-Fix Suggestions

For certain validation errors, offer a one-click fix:

| Error | Fix |
|---|---|
| Missing `description` | Generate placeholder |
| Broken `$ref` | Suggest closest matching schema name |
| Duplicate `operationId` | Suggest unique name based on method + path |
| Missing `summary` | Derive from operationId |
| Unused schema | Remove with confirmation |

#### Schema Autocomplete & $ref Picker

- When editing a `$ref` field in the form or Monaco, show a picker listing all available schemas in `components/schemas`
- Fuzzy search in the picker
- Preview the referenced schema inline on hover

#### Workspace Search

- Full-text search across all YAML content in the workspace
- Filter by: project, OpenAPI version, validation status, modified date
- Results show file + matched line + context
- Click to navigate directly

#### Diff Viewer (Standalone)

- Open any two files or versions side-by-side
- Accessible from context menu: "Compare with..."
- Syntax-highlighted YAML diff

#### Plugin System (Architecture Only)

- Define a plugin API interface in `shared/plugin-api.ts`
- Plugins can: register custom validation rules, add context menu items, add sidebar panels, add form field types
- Plugin loading via Electron's dynamic import from a plugins directory
- Plugin manager UI in Settings

> **Scope note:** An actual plugin marketplace is out of scope for Phase 3. Only the loading infrastructure and API surface are built.

#### Settings Panel

| Category | Options |
|---|---|
| General | Autosave interval, confirm on delete, default OpenAPI version |
| Editor | Tab size, font size, font family, minimap, word wrap |
| Theme | Dark (default), light, high contrast, system |
| Validation | Rules on/off per category, severity overrides |
| GitHub | Manage connected accounts, token management |
| Keyboard | View and remap all shortcuts |
| Export | Default format (YAML/JSON), include validation gate |

---

## Validation Engine Design

### Architecture

```
ValidationEngine
    │
    ├── SpectralAdapter         ← wraps @stoplight/spectral-core
    │     ├── OAS2Ruleset
    │     ├── OAS3Ruleset
    │     └── OAS31Ruleset
    │
    ├── CustomRulesEngine       ← Spectra-specific rules
    │     ├── DuplicateOperationIdRule
    │     ├── UnusedSchemaRule
    │     ├── MissingDescriptionRule
    │     ├── WeakNamingRule
    │     ├── InvalidStatusCodeRule
    │     ├── BrokenRefRule
    │     ├── CircularRefRule
    │     └── VersionSpecificRule
    │
    └── ResultAggregator        ← merges + deduplicates results
```

### ValidationIssue Type

```typescript
interface ValidationIssue {
  id:            string;
  severity:      'error' | 'warning' | 'hint' | 'info';
  code:          string;         // e.g. 'oas3-missing-description'
  message:       string;
  path:          string[];       // JSON path to the issue
  range: {
    start: { line: number; character: number };
    end:   { line: number; character: number };
  };
  source:        'spectral' | 'custom';
  fixable:       boolean;
  fixSuggestion?: string;
}
```

### Execution Flow

1. File saved or code changed (debounced 500ms)
2. Main process `ValidationService.validate(content, version)` called via IPC
3. YAML parsed → passed to SpectralAdapter and CustomRulesEngine in parallel
4. Results merged, deduplicated, sorted by severity then line number
5. Results sent back to renderer via IPC response
6. Renderer updates: Monaco markers, Problems panel, file tree icon, status bar count
7. Results cached in SQLite `validation_results` table

---

## GitHub Sync Design

### Authentication Flow

```
User clicks "Connect GitHub"
    → Open GitHub OAuth or PAT input dialog
    → Validate token via GET /user
    → Store token securely in OS keychain (keytar)
    → Show connected GitHub username in Settings
```

### File Sync State Machine

```
           ┌──────────┐
     ┌─────►  UNKNOWN  ├──── check status ────┐
     │     └──────────┘                        │
     │                                         ▼
     │     ┌──────────┐               ┌────────────────┐
     │     │  SYNCED  │◄──── push ────│    AHEAD       │
     │     └──────────┘               │ (local changes)│
     │          │                     └────────────────┘
     │          │ remote changed
     │          ▼
     │     ┌──────────┐               ┌────────────────┐
     │     │  BEHIND  ├──── pull ────►│    SYNCED      │
     │     └──────────┘               └────────────────┘
     │
     │     ┌──────────┐
     └─────┤ CONFLICT │◄─── both changed
           └──────────┘
                │
                ▼
         Conflict Resolution Modal
         [Accept Local]  [Accept Remote]  [Merge Manually]
```

### Pull Flow

1. Fetch remote file SHA via GitHub API
2. Compare with stored `remote_sha`
3. If changed: fetch remote content, show diff
4. Options: Overwrite local / Keep local / Open conflict view
5. If accepted: update local file, update `remote_sha`, create version snapshot

### Push Flow

1. Validate file (block push if errors, warn if warnings)
2. Get current remote SHA (required for GitHub API update)
3. Encode content as base64
4. `PUT /repos/{owner}/{repo}/contents/{path}` with content + sha + commit message
5. Update `remote_sha` and `last_synced_at` in `github_links`
6. Create version snapshot with `created_by = github_username`
7. Log to Git Log panel

---

## Versioning Design

### Version Creation Triggers

| Trigger | Auto-creates version? | Configurable? |
|---|---|---|
| Manual Save (Ctrl+S) | Optional (per settings) | Yes |
| GitHub Push | Always | No |
| Restore from version | Always (before restore) | No |
| Import file | Optional | Yes |
| Manual "Create Version" | Always | — |

### Auto Change Summary Generation

```typescript
function generateChangeSummary(prev: string, next: string): string {
  const prevParsed = parse(prev);
  const nextParsed = parse(next);
  const changes: string[] = [];

  const prevPaths = Object.keys(prevParsed.paths ?? {});
  const nextPaths = Object.keys(nextParsed.paths ?? {});

  const added   = nextPaths.filter(p => !prevPaths.includes(p));
  const removed = prevPaths.filter(p => !nextPaths.includes(p));

  if (added.length)   changes.push(`Added paths: ${added.join(', ')}`);
  if (removed.length) changes.push(`Removed paths: ${removed.join(', ')}`);

  if (prevParsed.info?.version !== nextParsed.info?.version)
    changes.push(`Version: ${prevParsed.info?.version} → ${nextParsed.info?.version}`);

  const prevSchemas    = Object.keys(prevParsed.components?.schemas ?? {});
  const nextSchemas    = Object.keys(nextParsed.components?.schemas ?? {});
  const addedSchemas   = nextSchemas.filter(s => !prevSchemas.includes(s));
  const removedSchemas = prevSchemas.filter(s => !nextSchemas.includes(s));

  if (addedSchemas.length)   changes.push(`Added schemas: ${addedSchemas.join(', ')}`);
  if (removedSchemas.length) changes.push(`Removed schemas: ${removedSchemas.join(', ')}`);

  return changes.length ? changes.join('; ') : 'Minor changes';
}
```

---

## Issues Found in Original Prompt — Fixed

| Issue | Original | Fixed |
|---|---|---|
| **Bidirectional YAML-to-form sync overpromised** | "Changes in code should update form where possible" with no caveat | Clearly documented as best-effort with a graceful degradation banner |
| **Token/auth storage not specified** | "Link to GitHub" with no auth detail | Specified as OS keychain via `keytar`, never plaintext |
| **"Plugin-friendly architecture" was vague** | Listed as a bullet with no detail | Defined as a concrete plugin API surface in Phase 3 with explicit scope limits |
| **Circular reference handling unclear** | "Detect invalid references" | Split into broken $ref (error) vs circular references (warning, non-blocking) |
| **YAML round-trip not addressed** | "Import/export without losing data" | Specified `yaml` library in round-trip mode; edge cases documented |
| **Conflict resolution not designed** | "Handle GitHub conflicts" | Full state machine with 3-panel conflict resolution UI specified |
| **Local database not specified** | "Local project database" | Explicitly `better-sqlite3` with full schema, migrations, and repository pattern |
| **GitHub API rate limits not mentioned** | Absent | Cache SHA locally, show rate limit errors gracefully, retry with backoff |
| **Version restore non-destructive flow missing** | "Restore old versions" | Restore always creates a new snapshot before overwriting |

---

## Development Roadmap

### Sprint 1–2: Shell & Foundation
- Electron + Vite + React + TypeScript + TailwindCSS project setup
- Main/renderer process architecture with typed IPC
- SQLite setup with migrations and repository layer
- AppShell layout: sidebar + main area + bottom panel with resize handles
- Workspace and project CRUD
- File system read/write service

### Sprint 3–4: Project Tree & File Management
- Recursive project tree component
- Folder creation, rename, delete
- File creation with OAS version picker (2.0 / 3.0 / 3.1)
- Right-click context menus (file + folder)
- Drag-and-drop reordering
- Tab system with dirty state tracking
- Quick Open (`Ctrl+P`)

### Sprint 5–6: Form Editor (Core)
- Info section
- Servers section
- Paths + operations (GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS)
- Parameters (all locations)
- RequestBody + Responses
- Real-time YAML generation from form state

### Sprint 7–8: Code Editor & Bidirectional Sync
- Monaco integration with YAML language support
- OpenAPI JSON Schema IntelliSense
- Format document
- YAML-to-form sync (best-effort, with degradation banner)
- Autosave + crash recovery

### Sprint 9: Components, Schemas & $ref
- Components section form (schemas, securitySchemes, parameters, responses)
- Recursive schema builder (object, array, primitive, allOf/anyOf/oneOf)
- $ref picker with autocomplete
- Tags and security sections

### Sprint 10: Validation Engine
- Spectral integration with all three OAS rulesets
- Custom rules engine with all Spectra rules
- Monaco inline markers
- Problems panel in bottom area
- File tree status icons and status bar counts

### Sprint 11: Swagger UI Preview
- Embed `swagger-ui-react` in Preview view
- Live re-render on content change (debounced)
- Error boundary for malformed YAML

### Sprint 12: Import / Export
- Import single YAML/JSON file
- Import folder/zip
- Export single file (YAML/JSON)
- Export project as zip
- Validation gate on export

### Sprint 13–14: Versioning System
- Version snapshot on save (configurable)
- Version timeline UI
- Version diff viewer
- Restore with pre-restore snapshot
- Auto change summary generation

### Sprint 15–16: GitHub Integration
- PAT + OAuth auth with `keytar`
- Link file and project to GitHub repo
- Pull with diff preview
- Push with commit message
- Conflict resolution modal
- Git status indicators in sidebar
- Git Log panel

### Sprint 17: Polish, Performance & Testing
- Command palette
- Keyboard shortcuts system
- Settings panel (all categories)
- Unit tests (validation, yaml util, version service)
- E2E tests (project creation, file editing, export)
- Performance audit (large YAML files, many projects)
- App packaging and auto-update setup

### Sprint 18: Phase 3 Features
- Templates library
- Version migration assistant
- Auto-fix suggestions
- Workspace search
- Plugin system infrastructure

---

## Quality & Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Performance** | Opening a 5,000-line YAML file must not block the UI. YAML parsing moved off main thread if >1,000 lines. |
| **Reliability** | No data loss under any circumstance. All writes go to disk before confirming to user. |
| **Accessibility** | Keyboard-navigable throughout. ARIA labels on all interactive elements. Focus management in modals. |
| **Theme** | Dark theme by default. TailwindCSS `dark:` variants. System preference detection on first launch. |
| **Distribution** | Signed installers for macOS (.dmg), Windows (.exe via NSIS), Linux (.AppImage + .deb). Auto-update via `electron-updater` pointing to GitHub Releases. |
| **Security** | Context isolation ON. Node integration in renderer OFF. All Node.js access via typed contextBridge. No `eval`. CSP headers set. |
| **Logging** | `electron-log` writing to OS log directory. Log rotation. User can open log file from Help menu. |

---

*Spectra — every API, in full spectrum.*
