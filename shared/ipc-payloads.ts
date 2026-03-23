export interface WorkspaceRow {
  id: string;
  name: string;
  description: string | null;
  rootPath: string;
  createdAt: number;
  updatedAt: number;
  settings: Record<string, unknown>;
}

export interface ProjectRow {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  rootPath: string;
}

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface FsReadFileResult {
  content: string;
  encoding: 'utf8';
}

export interface FsWriteFileInput {
  path: string;
  content: string;
}

export interface FsRenameInput {
  from: string;
  to: string;
}

export interface FsMkdirInput {
  path: string;
  recursive?: boolean;
}

export interface IpcErrorPayload {
  code: string;
  message: string;
}

export interface FolderRow {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  path: string;
  createdAt: number;
}

export interface SpecFileRow {
  id: string;
  projectId: string;
  folderId: string | null;
  name: string;
  filePath: string;
  openapiVersion: string;
  status: string;
  isFavorite: boolean;
  lastValidatedAt: number | null;
  validationStatus: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectTreeSnapshot {
  folders: FolderRow[];
  files: SpecFileRow[];
}

export interface CreateFolderInput {
  projectId: string;
  parentFolderId: string | null;
  name: string;
}

export interface RenameFolderInput {
  folderId: string;
  name: string;
}

export interface CreateSpecFileInput {
  projectId: string;
  folderId: string | null;
  name: string;
  openapiVersion: '2.0' | '3.0' | '3.1';
}

export interface RenameSpecFileInput {
  specFileId: string;
  name: string;
}

export interface QuickOpenEntry {
  specFileId: string;
  projectId: string;
  projectName: string;
  name: string;
  filePath: string;
  openapiVersion: string;
}

export interface MoveFolderInput {
  folderId: string;
  newParentFolderId: string | null;
}

export interface MoveSpecFileInput {
  specFileId: string;
  newFolderId: string | null;
}
