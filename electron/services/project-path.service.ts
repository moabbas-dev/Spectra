import path from 'node:path';
import type { Database } from 'better-sqlite3';
import * as projectRepo from '../db/repositories/project.repo';
import * as workspaceRepo from '../db/repositories/workspace.repo';

import { sanitizePathSegment } from '../utils/sanitize.util';

export function getProjectRootAbsolute(
  db: Database,
  projectId: string,
): string {
  const project = projectRepo.getProjectById(db, projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  const ws = workspaceRepo.getWorkspaceById(db, project.workspaceId);
  if (!ws) {
    throw new Error('Workspace not found');
  }
  const folderName = sanitizePathSegment(project.name);
  return path.join(ws.rootPath, folderName);
}
