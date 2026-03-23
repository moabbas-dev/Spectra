import type { Database } from 'better-sqlite3';
import type { QuickOpenEntry, SpecFileRow } from '../../../shared/ipc-payloads';
import { randomUUID } from 'node:crypto';

function rowToSpec(r: {
  id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  file_path: string;
  openapi_version: string;
  status: string;
  is_favorite: number;
  last_validated_at: number | null;
  validation_status: string | null;
  created_at: number;
  updated_at: number;
}): SpecFileRow {
  return {
    id: r.id,
    projectId: r.project_id,
    folderId: r.folder_id,
    name: r.name,
    filePath: r.file_path,
    openapiVersion: r.openapi_version,
    status: r.status,
    isFavorite: r.is_favorite === 1,
    lastValidatedAt: r.last_validated_at,
    validationStatus: r.validation_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listSpecFilesByProject(
  db: Database,
  projectId: string,
): SpecFileRow[] {
  const rows = db
    .prepare(
      `SELECT id, project_id, folder_id, name, file_path, openapi_version, status,
              is_favorite, last_validated_at, validation_status, created_at, updated_at
       FROM spec_files WHERE project_id = ? ORDER BY file_path ASC`,
    )
    .all(projectId) as Array<{
      id: string;
      project_id: string;
      folder_id: string | null;
      name: string;
      file_path: string;
      openapi_version: string;
      status: string;
      is_favorite: number;
      last_validated_at: number | null;
      validation_status: string | null;
      created_at: number;
      updated_at: number;
    }>;
  return rows.map(rowToSpec);
}

export function listSpecFilesByWorkspace(
  db: Database,
  workspaceId: string,
): SpecFileRow[] {
  const rows = db
    .prepare(
      `SELECT sf.id, sf.project_id, sf.folder_id, sf.name, sf.file_path, sf.openapi_version,
              sf.status, sf.is_favorite, sf.last_validated_at, sf.validation_status,
              sf.created_at, sf.updated_at
       FROM spec_files sf
       INNER JOIN projects p ON p.id = sf.project_id
       WHERE p.workspace_id = ?
       ORDER BY sf.file_path ASC`,
    )
    .all(workspaceId) as Array<{
      id: string;
      project_id: string;
      folder_id: string | null;
      name: string;
      file_path: string;
      openapi_version: string;
      status: string;
      is_favorite: number;
      last_validated_at: number | null;
      validation_status: string | null;
      created_at: number;
      updated_at: number;
    }>;
  return rows.map(rowToSpec);
}

export function getSpecFileById(
  db: Database,
  id: string,
): SpecFileRow | null {
  const row = db
    .prepare(
      `SELECT id, project_id, folder_id, name, file_path, openapi_version, status,
              is_favorite, last_validated_at, validation_status, created_at, updated_at
       FROM spec_files WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        project_id: string;
        folder_id: string | null;
        name: string;
        file_path: string;
        openapi_version: string;
        status: string;
        is_favorite: number;
        last_validated_at: number | null;
        validation_status: string | null;
        created_at: number;
        updated_at: number;
      }
    | undefined;
  return row ? rowToSpec(row) : null;
}

export function insertSpecFile(
  db: Database,
  input: {
    projectId: string;
    folderId: string | null;
    name: string;
    filePath: string;
    openapiVersion: string;
  },
): SpecFileRow {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO spec_files (
       id, project_id, folder_id, name, file_path, openapi_version, status,
       is_favorite, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, ?, ?)`,
  ).run(
    id,
    input.projectId,
    input.folderId,
    input.name,
    input.filePath,
    input.openapiVersion,
    now,
    now,
  );
  const created = getSpecFileById(db, id);
  if (!created) throw new Error('Failed to read spec file after insert');
  return created;
}

export function updateSpecFileNameAndPath(
  db: Database,
  id: string,
  name: string,
  filePath: string,
): void {
  const now = Date.now();
  db.prepare(
    `UPDATE spec_files SET name = ?, file_path = ?, updated_at = ? WHERE id = ?`,
  ).run(name, filePath, now, id);
}

export function deleteSpecFileById(db: Database, id: string): void {
  db.prepare('DELETE FROM spec_files WHERE id = ?').run(id);
}

export function updateSpecFileFolderAndPath(
  db: Database,
  id: string,
  folderId: string | null,
  filePath: string,
): void {
  const now = Date.now();
  db.prepare(
    `UPDATE spec_files SET folder_id = ?, file_path = ?, updated_at = ? WHERE id = ?`,
  ).run(folderId, filePath, now, id);
}

export function listQuickOpenEntries(
  db: Database,
  workspaceId: string,
): QuickOpenEntry[] {
  const rows = db
    .prepare(
      `SELECT sf.id AS spec_file_id, sf.project_id, p.name AS project_name,
              sf.name, sf.file_path, sf.openapi_version
       FROM spec_files sf
       INNER JOIN projects p ON p.id = sf.project_id
       WHERE p.workspace_id = ?
       ORDER BY p.name ASC, sf.file_path ASC`,
    )
    .all(workspaceId) as Array<{
      spec_file_id: string;
      project_id: string;
      project_name: string;
      name: string;
      file_path: string;
      openapi_version: string;
    }>;
  return rows.map((r) => ({
    specFileId: r.spec_file_id,
    projectId: r.project_id,
    projectName: r.project_name,
    name: r.name,
    filePath: r.file_path,
    openapiVersion: r.openapi_version,
  }));
}
