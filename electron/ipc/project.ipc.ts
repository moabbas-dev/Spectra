import type { IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { CreateProjectInput } from '../../shared/ipc-payloads';
import * as projectRepo from '../db/repositories/project.repo';
import * as workspaceRepo from '../db/repositories/workspace.repo';

export function registerProjectIpc(
  db: Database,
  handle: (
    channel: string,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => unknown | Promise<unknown>,
  ) => void,
  IPC: { PROJECT_CREATE: string; PROJECT_LIST: string; PROJECT_DELETE: string },
): void {
  handle(IPC.PROJECT_CREATE, async (_e, payload: unknown) => {
    const input = payload as CreateProjectInput;
    const ws = workspaceRepo.getWorkspaceById(db, input.workspaceId);
    if (!ws) {
      throw new Error('Workspace not found');
    }
    const project = projectRepo.createProject(db, input);
    const root = path.join(ws.rootPath, project.id);
    await fs.mkdir(root, { recursive: true });
    return project;
  });

  handle(IPC.PROJECT_LIST, (_e, workspaceId: unknown) => {
    return projectRepo.listProjectsByWorkspace(db, workspaceId as string);
  });

  handle(IPC.PROJECT_DELETE, async (_e, id: unknown) => {
    const pid = id as string;
    const project = projectRepo.getProjectById(db, pid);
    if (project) {
      const ws = workspaceRepo.getWorkspaceById(db, project.workspaceId);
      if (ws) {
        const root = path.join(ws.rootPath, pid);
        await fs.rm(root, { recursive: true, force: true }).catch(() => {
          /* disk may already be gone */
        });
      }
    }
    projectRepo.deleteProject(db, pid);
    return { ok: true };
  });
}
