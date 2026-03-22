import type { Database } from 'better-sqlite3';
import type { CreateProjectInput, ProjectRow } from '../../../shared/ipc-payloads';
import { randomUUID } from 'node:crypto';

function rowToProject(r: {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: number;
  updated_at: number;
}): ProjectRow {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    name: r.name,
    description: r.description,
    color: r.color,
    icon: r.icon,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listProjectsByWorkspace(
  db: Database,
  workspaceId: string,
): ProjectRow[] {
  const rows = db
    .prepare(
      `SELECT id, workspace_id, name, description, color, icon, created_at, updated_at
       FROM projects WHERE workspace_id = ? ORDER BY name ASC`,
    )
    .all(workspaceId) as Array<{
      id: string;
      workspace_id: string;
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      created_at: number;
      updated_at: number;
    }>;
  return rows.map(rowToProject);
}

export function createProject(
  db: Database,
  input: CreateProjectInput,
): ProjectRow {
  const now = Date.now();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO projects (id, workspace_id, name, description, color, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.workspaceId,
    input.name,
    input.description ?? null,
    input.color ?? null,
    input.icon ?? null,
    now,
    now,
  );
  const row = db
    .prepare(
      `SELECT id, workspace_id, name, description, color, icon, created_at, updated_at
       FROM projects WHERE id = ?`,
    )
    .get(id) as {
      id: string;
      workspace_id: string;
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      created_at: number;
      updated_at: number;
    };
  return rowToProject(row);
}

export function deleteProject(db: Database, id: string): void {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function getProjectById(
  db: Database,
  id: string,
): ProjectRow | null {
  const row = db
    .prepare(
      `SELECT id, workspace_id, name, description, color, icon, created_at, updated_at
       FROM projects WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        workspace_id: string;
        name: string;
        description: string | null;
        color: string | null;
        icon: string | null;
        created_at: number;
        updated_at: number;
      }
    | undefined;
  return row ? rowToProject(row) : null;
}
