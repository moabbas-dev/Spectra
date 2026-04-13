import type { IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  CreateFolderInput,
  CreateSpecFileInput,
  MoveFolderInput,
  MoveSpecFileInput,
  ProjectTreeSnapshot,
  RenameFolderInput,
  RenameSpecFileInput,
} from '../../shared/ipc-payloads';
import { IPC } from '../../shared/ipc-channels';
import * as folderRepo from '../db/repositories/folder.repo';
import * as specFileRepo from '../db/repositories/spec-file.repo';
import { getProjectRootAbsolute } from '../services/project-path.service';
import { blankOpenApiDocument } from '../utils/openapi-blank.util';
import { sanitizePathSegment } from '../utils/sanitize.util';

type HandleFn = (
  channel: string,
  listener: (
    event: IpcMainInvokeEvent,
    ...args: unknown[]
  ) => unknown | Promise<unknown>,
) => void;

export function registerTreeIpc(db: Database, handle: HandleFn): void {
  handle(IPC.PROJECT_TREE_GET, (_e, projectId: unknown) => {
    const pid = projectId as string;
    const snap: ProjectTreeSnapshot = {
      folders: folderRepo.listFoldersByProject(db, pid),
      files: specFileRepo.listSpecFilesByProject(db, pid),
    };
    return snap;
  });

  handle(IPC.QUICK_OPEN_LIST, (_e, workspaceId: unknown) => {
    return specFileRepo.listQuickOpenEntries(db, workspaceId as string);
  });

  handle(IPC.FOLDER_CREATE, async (_e, payload: unknown) => {
    const input = payload as CreateFolderInput;
    const name = sanitizePathSegment(input.name);
    const root = getProjectRootAbsolute(db, input.projectId);
    let relPath: string;
    let parentFolderId: string | null = input.parentFolderId;

    if (parentFolderId) {
      const parent = folderRepo.getFolderById(db, parentFolderId);
      if (!parent || parent.projectId !== input.projectId) {
        throw new Error('Parent folder not found');
      }
      relPath = path.join(parent.path, name);
    } else {
      relPath = name;
    }

    const existing = folderRepo.listFoldersByProject(db, input.projectId);
    if (existing.some((f) => f.path === relPath)) {
      throw new Error('A folder with this path already exists');
    }

    const absPath = path.join(root, relPath);
    await fs.mkdir(absPath, { recursive: true });

    return folderRepo.insertFolder(db, {
      projectId: input.projectId,
      parentFolderId,
      name,
      path: relPath,
    });
  });

  handle(IPC.FOLDER_RENAME, async (_e, payload: unknown) => {
    const input = payload as RenameFolderInput;
    const newName = sanitizePathSegment(input.name);
    const folder = folderRepo.getFolderById(db, input.folderId);
    if (!folder) throw new Error('Folder not found');

    const root = getProjectRootAbsolute(db, folder.projectId);
    const oldRel = folder.path;
    const oldAbs = path.join(root, oldRel);
    const parentRel =
      path.dirname(oldRel) === '.' ? '' : path.dirname(oldRel);
    const newRel = parentRel ? path.join(parentRel, newName) : newName;
    const newAbs = path.join(root, newRel);

    const siblings = folderRepo.listFoldersByProject(db, folder.projectId);
    if (
      siblings.some(
        (f) => f.id !== folder.id && f.path === newRel,
      )
    ) {
      throw new Error('A folder with this name already exists here');
    }

    await fs.rename(oldAbs, newAbs);

    const allFolders = folderRepo.listFoldersByProject(db, folder.projectId);
    const mapFolderPath = (p: string): string => {
      if (p === oldRel) return newRel;
      const prefix = oldRel + path.sep;
      if (p.startsWith(prefix)) {
        return newRel + path.sep + p.slice(prefix.length);
      }
      return p;
    };

    for (const f of allFolders) {
      const nextPath = mapFolderPath(f.path);
      if (nextPath === f.path) continue;
      const nextName = path.basename(nextPath);
      folderRepo.updateFolderPathAndName(db, f.id, nextName, nextPath);
    }

    const files = specFileRepo.listSpecFilesByProject(db, folder.projectId);
    const oldAbsPrefix = oldAbs + path.sep;
    for (const sf of files) {
      if (
        sf.filePath === oldAbs ||
        sf.filePath.startsWith(oldAbsPrefix)
      ) {
        const nextFp =
          newAbs + sf.filePath.slice(oldAbs.length);
        const base = path.basename(nextFp, path.extname(nextFp));
        specFileRepo.updateSpecFileNameAndPath(db, sf.id, base, nextFp);
      }
    }

    const updated = folderRepo.getFolderById(db, input.folderId);
    if (!updated) throw new Error('Folder missing after rename');
    return updated;
  });

  handle(IPC.FOLDER_DELETE, async (_e, folderId: unknown) => {
    const id = folderId as string;
    const folder = folderRepo.getFolderById(db, id);
    if (!folder) return { ok: true };

    const root = getProjectRootAbsolute(db, folder.projectId);
    const absPath = path.join(root, folder.path);
    await fs.rm(absPath, { recursive: true, force: true });

    const allFolders = folderRepo.listFoldersByProject(db, folder.projectId);
    const toDeleteFolders = allFolders
      .filter(
        (f) => f.path === folder.path || f.path.startsWith(folder.path + path.sep),
      )
      .sort((a, b) => b.path.length - a.path.length);

    const allFiles = specFileRepo.listSpecFilesByProject(db, folder.projectId);
    const prefix = absPath + path.sep;
    for (const sf of allFiles) {
      if (sf.filePath === absPath || sf.filePath.startsWith(prefix)) {
        specFileRepo.deleteSpecFileById(db, sf.id);
      }
    }

    for (const f of toDeleteFolders) {
      folderRepo.deleteFolderById(db, f.id);
    }

    return { ok: true };
  });

  handle(IPC.SPEC_FILE_CREATE, async (_e, payload: unknown) => {
    const input = payload as CreateSpecFileInput;
    const stem = sanitizePathSegment(input.name).replace(/\.(yaml|yml|json)$/i, '');
    const root = getProjectRootAbsolute(db, input.projectId);
    let relDir = '';
    let folderId: string | null = input.folderId;

    if (folderId) {
      const folder = folderRepo.getFolderById(db, folderId);
      if (!folder || folder.projectId !== input.projectId) {
        throw new Error('Folder not found');
      }
      relDir = folder.path;
    }

    const fileName = `${stem}.yaml`;
    const absPath = relDir
      ? path.join(root, relDir, fileName)
      : path.join(root, fileName);

    try {
      await fs.access(absPath);
      throw new Error('A file with this name already exists');
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        /* ok */
      } else {
        throw e;
      }
    }

    const body = blankOpenApiDocument(input.openapiVersion, stem);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, body, 'utf8');

    return specFileRepo.insertSpecFile(db, {
      projectId: input.projectId,
      folderId,
      name: stem,
      filePath: absPath,
      openapiVersion: input.openapiVersion,
    });
  });

  handle(IPC.SPEC_FILE_DELETE, async (_e, specFileId: unknown) => {
    const id = specFileId as string;
    const row = specFileRepo.getSpecFileById(db, id);
    if (!row) return { ok: true };
    await fs.rm(row.filePath, { force: true });
    specFileRepo.deleteSpecFileById(db, id);
    return { ok: true };
  });

  handle(IPC.SPEC_FILE_RENAME, async (_e, payload: unknown) => {
    const input = payload as RenameSpecFileInput;
    const newStem = sanitizePathSegment(input.name).replace(/\.(yaml|yml|json)$/i, '');
    const row = specFileRepo.getSpecFileById(db, input.specFileId);
    if (!row) throw new Error('Spec file not found');

    const ext = path.extname(row.filePath) || '.yaml';
    const dir = path.dirname(row.filePath);
    const newPath = path.join(dir, `${newStem}${ext}`);

    if (newPath !== row.filePath) {
      try {
        await fs.stat(newPath);
        throw new Error('Target file already exists');
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          /* ok */
        } else {
          throw e;
        }
      }
      await fs.rename(row.filePath, newPath);
    }

    specFileRepo.updateSpecFileNameAndPath(db, row.id, newStem, newPath);
    const updated = specFileRepo.getSpecFileById(db, row.id);
    if (!updated) throw new Error('Spec file missing after rename');
    return updated;
  });

  /* ── Move folder (drag-and-drop) ── */
  handle(IPC.FOLDER_MOVE, async (_e, payload: unknown) => {
    const input = payload as MoveFolderInput;
    const folder = folderRepo.getFolderById(db, input.folderId);
    if (!folder) throw new Error('Folder not found');

    const root = getProjectRootAbsolute(db, folder.projectId);
    const oldRel = folder.path;
    const oldAbs = path.join(root, oldRel);

    let newRel: string;
    if (input.newParentFolderId) {
      const parent = folderRepo.getFolderById(db, input.newParentFolderId);
      if (!parent || parent.projectId !== folder.projectId) {
        throw new Error('Target folder not found');
      }
      newRel = path.join(parent.path, folder.name);
    } else {
      newRel = folder.name;
    }

    if (newRel === oldRel) return folder;

    const newAbs = path.join(root, newRel);
    await fs.rename(oldAbs, newAbs);

    /* Update this folder and all descendants */
    const allFolders = folderRepo.listFoldersByProject(db, folder.projectId);
    const oldPrefix = oldRel + path.sep;
    for (const f of allFolders) {
      if (f.id === folder.id) {
        folderRepo.updateFolderParent(db, f.id, input.newParentFolderId, folder.name, newRel);
      } else if (f.path.startsWith(oldPrefix)) {
        const updatedRel = newRel + path.sep + f.path.slice(oldPrefix.length);
        folderRepo.updateFolderPathAndName(db, f.id, f.name, updatedRel);
      }
    }

    /* Update file paths */
    const files = specFileRepo.listSpecFilesByProject(db, folder.projectId);
    const oldAbsPrefix = oldAbs + path.sep;
    for (const sf of files) {
      if (sf.filePath.startsWith(oldAbsPrefix) || sf.filePath === oldAbs) {
        const nextFp = newAbs + sf.filePath.slice(oldAbs.length);
        specFileRepo.updateSpecFileNameAndPath(db, sf.id, sf.name, nextFp);
      }
    }

    return folderRepo.getFolderById(db, input.folderId);
  });

  /* ── Move spec file (drag-and-drop) ── */
  handle(IPC.SPEC_FILE_MOVE, async (_e, payload: unknown) => {
    const input = payload as MoveSpecFileInput;
    const row = specFileRepo.getSpecFileById(db, input.specFileId);
    if (!row) throw new Error('Spec file not found');

    const root = getProjectRootAbsolute(db, row.projectId);
    const fileName = path.basename(row.filePath);
    let newAbs: string;

    if (input.newFolderId) {
      const folder = folderRepo.getFolderById(db, input.newFolderId);
      if (!folder || folder.projectId !== row.projectId) {
        throw new Error('Target folder not found');
      }
      newAbs = path.join(root, folder.path, fileName);
    } else {
      newAbs = path.join(root, fileName);
    }

    if (newAbs === row.filePath) return row;

    await fs.rename(row.filePath, newAbs);
    specFileRepo.updateSpecFileFolderAndPath(db, row.id, input.newFolderId, newAbs);

    return specFileRepo.getSpecFileById(db, row.id);
  });
}
