import type { IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import type { CreateVersionInput, RestoreVersionInput } from '../../shared/ipc-payloads';
import {
  createVersion,
  listVersions,
  getVersionById,
  deleteVersion,
} from '../db/repositories/version.repo';
import { getSpecFileById } from '../db/repositories/spec-file.repo';
import * as fs from 'node:fs';

export function registerVersionIpc(
  db: Database,
  handle: (
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ) => void,
  IPC: {
    VERSION_CREATE: string;
    VERSION_LIST: string;
    VERSION_GET: string;
    VERSION_RESTORE: string;
    VERSION_DELETE: string;
  },
): void {
  /* VERSION_CREATE — create a new version snapshot */
  handle(IPC.VERSION_CREATE, (_event, payload: unknown) => {
    const input = payload as CreateVersionInput;
    const spec = getSpecFileById(db, input.specFileId);
    if (!spec) throw new Error(`Spec file not found: ${input.specFileId}`);

    // Read current file content
    const content = fs.readFileSync(spec.filePath, 'utf8');
    return createVersion(db, input.specFileId, content, input.label);
  });

  /* VERSION_LIST — list all versions for a spec file (newest first) */
  handle(IPC.VERSION_LIST, (_event, specFileId: unknown) => {
    return listVersions(db, specFileId as string);
  });

  /* VERSION_GET — get a single version by ID */
  handle(IPC.VERSION_GET, (_event, versionId: unknown) => {
    const version = getVersionById(db, versionId as string);
    if (!version) throw new Error(`Version not found: ${versionId}`);
    return version;
  });

  /* VERSION_RESTORE — restore a previous version (non-destructive) */
  handle(IPC.VERSION_RESTORE, (_event, payload: unknown) => {
    const input = payload as RestoreVersionInput;

    // Get the version to restore
    const version = getVersionById(db, input.versionId);
    if (!version) throw new Error(`Version not found: ${input.versionId}`);

    // Get the spec file
    const spec = getSpecFileById(db, input.specFileId);
    if (!spec) throw new Error(`Spec file not found: ${input.specFileId}`);

    // Create a pre-restore snapshot of current content
    const currentContent = fs.readFileSync(spec.filePath, 'utf8');
    createVersion(db, input.specFileId, currentContent, `Pre-restore (before v${version.versionNumber})`);

    // Write the restored content to disk
    fs.writeFileSync(spec.filePath, version.content, 'utf8');

    // Create a new version marking the restore
    const restored = createVersion(
      db,
      input.specFileId,
      version.content,
      `Restored from v${version.versionNumber}`,
    );

    return { restored, content: version.content };
  });

  /* VERSION_DELETE — delete a specific version */
  handle(IPC.VERSION_DELETE, (_event, versionId: unknown) => {
    const version = getVersionById(db, versionId as string);
    if (!version) throw new Error(`Version not found: ${versionId}`);
    deleteVersion(db, versionId as string);
    return { success: true };
  });
}
