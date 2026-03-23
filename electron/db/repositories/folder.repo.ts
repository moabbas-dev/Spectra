import type { Database } from 'better-sqlite3';
import type { FolderRow } from '../../../shared/ipc-payloads';
import { randomUUID } from 'node:crypto';

function rowToFolder(r: {
  id: string;
  project_id: string;
  parent_folder_id: string | null;
  name: string;
  path: string;
  created_at: number;
}): FolderRow {
  return {
    id: r.id,
    projectId: r.project_id,
    parentFolderId: r.parent_folder_id,
    name: r.name,
    path: r.path,
    createdAt: r.created_at,
  };
}

export function listFoldersByProject(
  db: Database,
  projectId: string,
): FolderRow[] {
  const rows = db
    .prepare(
      `SELECT id, project_id, parent_folder_id, name, path, created_at
       FROM folders WHERE project_id = ? ORDER BY path ASC`,
    )
    .all(projectId) as Array<{
      id: string;
      project_id: string;
      parent_folder_id: string | null;
      name: string;
      path: string;
      created_at: number;
    }>;
  return rows.map(rowToFolder);
}

export function getFolderById(
  db: Database,
  id: string,
): FolderRow | null {
  const row = db
    .prepare(
      `SELECT id, project_id, parent_folder_id, name, path, created_at
       FROM folders WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        project_id: string;
        parent_folder_id: string | null;
        name: string;
        path: string;
        created_at: number;
      }
    | undefined;
  return row ? rowToFolder(row) : null;
}

export function insertFolder(
  db: Database,
  input: {
    projectId: string;
    parentFolderId: string | null;
    name: string;
    path: string;
  },
): FolderRow {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO folders (id, project_id, parent_folder_id, name, path, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.projectId,
    input.parentFolderId,
    input.name,
    input.path,
    now,
  );
  const created = getFolderById(db, id);
  if (!created) throw new Error('Failed to read folder after insert');
  return created;
}

export function updateFolderPathAndName(
  db: Database,
  folderId: string,
  name: string,
  relPath: string,
): void {
  db.prepare(
    `UPDATE folders SET name = ?, path = ? WHERE id = ?`,
  ).run(name, relPath, folderId);
}

export function updateFolderParent(
  db: Database,
  folderId: string,
  parentFolderId: string | null,
  name: string,
  relPath: string,
): void {
  db.prepare(
    `UPDATE folders SET parent_folder_id = ?, name = ?, path = ? WHERE id = ?`,
  ).run(parentFolderId, name, relPath, folderId);
}

export function deleteFolderById(db: Database, id: string): void {
  db.prepare('DELETE FROM folders WHERE id = ?').run(id);
}
