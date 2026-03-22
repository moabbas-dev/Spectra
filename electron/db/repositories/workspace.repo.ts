import type { Database } from 'better-sqlite3';
import type { CreateWorkspaceInput, WorkspaceRow } from '../../../shared/ipc-payloads';
import { randomUUID } from 'node:crypto';

function rowToWorkspace(r: {
  id: string;
  name: string;
  description: string | null;
  root_path: string;
  created_at: number;
  updated_at: number;
  settings: string;
}): WorkspaceRow {
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(r.settings) as Record<string, unknown>;
  } catch {
    settings = {};
  }
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    rootPath: r.root_path,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    settings,
  };
}

export function listWorkspaces(db: Database): WorkspaceRow[] {
  const rows = db
    .prepare(
      `SELECT id, name, description, root_path, created_at, updated_at, settings
       FROM workspaces ORDER BY updated_at DESC`,
    )
    .all() as Array<{
      id: string;
      name: string;
      description: string | null;
      root_path: string;
      created_at: number;
      updated_at: number;
      settings: string;
    }>;
  return rows.map(rowToWorkspace);
}

export function createWorkspace(
  db: Database,
  input: CreateWorkspaceInput,
): WorkspaceRow {
  const now = Date.now();
  const id = randomUUID();
  const settings = '{}';
  db.prepare(
    `INSERT INTO workspaces (id, name, description, root_path, created_at, updated_at, settings)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name,
    input.description ?? null,
    input.rootPath,
    now,
    now,
    settings,
  );
  const row = db
    .prepare(
      `SELECT id, name, description, root_path, created_at, updated_at, settings
       FROM workspaces WHERE id = ?`,
    )
    .get(id) as {
      id: string;
      name: string;
      description: string | null;
      root_path: string;
      created_at: number;
      updated_at: number;
      settings: string;
    };
  return rowToWorkspace(row);
}

export function deleteWorkspace(db: Database, id: string): void {
  db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
}

export function getWorkspaceById(
  db: Database,
  id: string,
): WorkspaceRow | null {
  const row = db
    .prepare(
      `SELECT id, name, description, root_path, created_at, updated_at, settings
       FROM workspaces WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        name: string;
        description: string | null;
        root_path: string;
        created_at: number;
        updated_at: number;
        settings: string;
      }
    | undefined;
  return row ? rowToWorkspace(row) : null;
}
