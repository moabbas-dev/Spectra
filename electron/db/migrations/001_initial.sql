-- Spectra initial schema (matches product spec)

CREATE TABLE IF NOT EXISTS workspaces (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT,
  root_path   TEXT    NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  settings    TEXT    NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT    PRIMARY KEY,
  workspace_id TEXT    NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  description  TEXT,
  color        TEXT,
  icon         TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS folders (
  id               TEXT    PRIMARY KEY,
  project_id       TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_folder_id TEXT    REFERENCES folders(id) ON DELETE CASCADE,
  name             TEXT    NOT NULL,
  path             TEXT    NOT NULL,
  created_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spec_files (
  id                TEXT    PRIMARY KEY,
  project_id        TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id         TEXT    REFERENCES folders(id) ON DELETE SET NULL,
  name              TEXT    NOT NULL,
  file_path         TEXT    NOT NULL,
  openapi_version   TEXT    NOT NULL,
  status            TEXT    NOT NULL DEFAULT 'draft',
  is_favorite       INTEGER NOT NULL DEFAULT 0,
  last_validated_at INTEGER,
  validation_status TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spec_versions (
  id             TEXT    PRIMARY KEY,
  spec_file_id   TEXT    NOT NULL REFERENCES spec_files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label  TEXT,
  content        TEXT    NOT NULL,
  content_hash   TEXT    NOT NULL,
  change_summary TEXT,
  created_at     INTEGER NOT NULL,
  created_by     TEXT    DEFAULT 'local',
  UNIQUE(spec_file_id, version_number)
);

CREATE TABLE IF NOT EXISTS github_links (
  id           TEXT    PRIMARY KEY,
  entity_type  TEXT    NOT NULL,
  entity_id    TEXT    NOT NULL,
  repo_owner   TEXT    NOT NULL,
  repo_name    TEXT    NOT NULL,
  branch       TEXT    NOT NULL DEFAULT 'main',
  file_path    TEXT,
  last_synced_at INTEGER,
  sync_status  TEXT,
  remote_sha   TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS validation_results (
  id              TEXT    PRIMARY KEY,
  spec_file_id    TEXT    NOT NULL REFERENCES spec_files(id) ON DELETE CASCADE,
  spec_version_id TEXT    REFERENCES spec_versions(id) ON DELETE SET NULL,
  run_at          INTEGER NOT NULL,
  total_errors    INTEGER NOT NULL DEFAULT 0,
  total_warnings  INTEGER NOT NULL DEFAULT 0,
  total_hints     INTEGER NOT NULL DEFAULT 0,
  results         TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  key   TEXT PRIMARY KEY,
  value TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT    PRIMARY KEY,
  action      TEXT    NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  payload     TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spec_files_project ON spec_files(project_id);
CREATE INDEX IF NOT EXISTS idx_spec_files_folder ON spec_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_spec_versions_file ON spec_versions(spec_file_id);
CREATE INDEX IF NOT EXISTS idx_github_links_entity ON github_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_file ON validation_results(spec_file_id);
