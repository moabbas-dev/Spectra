import type { IpcMainInvokeEvent } from 'electron';
import type { FsRenameInput, FsWriteFileInput } from '../../shared/ipc-payloads';
import * as fsService from '../services/file-system.service';

export function registerFsIpc(
  handle: (
    channel: string,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => unknown | Promise<unknown>,
  ) => void,
  IPC: {
    FS_READ_FILE: string;
    FS_WRITE_FILE: string;
    FS_DELETE_FILE: string;
    FS_RENAME: string;
    FS_MKDIR: string;
  },
): void {
  handle(IPC.FS_READ_FILE, async (_e, filePath: unknown) => {
    const content = await fsService.readTextFile(filePath as string);
    return { content, encoding: 'utf8' as const };
  });

  handle(IPC.FS_WRITE_FILE, async (_e, payload: unknown) => {
    const input = payload as FsWriteFileInput;
    await fsService.writeTextFile(input.path, input.content);
    return { ok: true };
  });

  handle(IPC.FS_DELETE_FILE, async (_e, targetPath: unknown) => {
    await fsService.deletePath(targetPath as string);
    return { ok: true };
  });

  handle(IPC.FS_RENAME, async (_e, payload: unknown) => {
    const input = payload as FsRenameInput;
    await fsService.renamePath(input.from, input.to);
    return { ok: true };
  });

  handle(IPC.FS_MKDIR, async (_e, dirPath: unknown, recursive?: unknown) => {
    await fsService.mkdirp(dirPath as string, {
      recursive: (recursive as boolean | undefined) ?? true,
    });
    return { ok: true };
  });
}
