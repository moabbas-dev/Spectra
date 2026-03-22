import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import { logger } from '../utils/logger.util';
import { registerFsIpc } from './fs.ipc';
import { registerGitIpc } from './git.ipc';
import { registerProjectIpc } from './project.ipc';
import { registerSpecIpc } from './spec.ipc';
import { registerTreeIpc } from './tree.ipc';
import { registerValidationIpc } from './validation.ipc';
import { registerVersionIpc } from './version.ipc';
import { registerWorkspaceIpc } from './workspace.ipc';

export function registerAllIpc(db: Database): void {
  const handle = (
    channel: string,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => unknown | Promise<unknown>,
  ): void => {
    ipcMain.handle(channel, async (event, ...args: unknown[]) => {
      try {
        return await listener(event, ...args);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`IPC ${channel} failed:`, err);
        throw new Error(message);
      }
    });
  };

  registerWorkspaceIpc(db, handle, IPC);
  registerProjectIpc(db, handle, IPC);
  registerTreeIpc(db, handle);
  registerFsIpc(handle, IPC);
  registerSpecIpc(handle, IPC);
  registerGitIpc(handle, IPC);
  registerVersionIpc(handle, IPC);
  registerValidationIpc(handle, IPC);
}
