import type { IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { CreateWorkspaceInput } from '../../shared/ipc-payloads';
import * as workspaceRepo from '../db/repositories/workspace.repo';
import { sanitizePathSegment } from '../utils/sanitize.util';

const ACTIVE_KEY = 'active_workspace_id';

function getSetting(db: Database, key: string): string | null {
  const row = db
    .prepare<[string], { value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
    )
    .get(key);
  return row?.value ?? null;
}

function setSetting(db: Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO user_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}

export function registerWorkspaceIpc(
  db: Database,
  handle: (
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ) => void,
  IPC: {
    WORKSPACE_CREATE: string;
    WORKSPACE_LIST: string;
    WORKSPACE_DELETE: string;
    WORKSPACE_SET_ACTIVE: string;
    WORKSPACE_GET_ACTIVE: string;
  },
): void {
  handle(IPC.WORKSPACE_CREATE, async (_e, payload: unknown) => {
    const input = payload as CreateWorkspaceInput;
    const folderName = sanitizePathSegment(input.name);
    input.rootPath = path.join(input.rootPath, folderName);
    await fs.mkdir(input.rootPath, { recursive: true });
    return workspaceRepo.createWorkspace(db, input);
  });

  handle(IPC.WORKSPACE_LIST, () => {
    return workspaceRepo.listWorkspaces(db);
  });

  handle(IPC.WORKSPACE_DELETE, (_e, id: unknown) => {
    workspaceRepo.deleteWorkspace(db, id as string);
    const active = getSetting(db, ACTIVE_KEY);
    if (active === id) {
      db.prepare('DELETE FROM user_settings WHERE key = ?').run(ACTIVE_KEY);
    }
    return { ok: true };
  });

  handle(IPC.WORKSPACE_SET_ACTIVE, (_e, id: unknown) => {
    setSetting(db, ACTIVE_KEY, id as string);
    return { ok: true };
  });

  handle(IPC.WORKSPACE_GET_ACTIVE, () => {
    return getActiveWorkspaceId(db);
  });
}

export function getActiveWorkspaceId(db: Database): string | null {
  return getSetting(db, ACTIVE_KEY);
}
