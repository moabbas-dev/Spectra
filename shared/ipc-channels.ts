export const IPC = {
  FS_READ_FILE: 'fs:read-file',
  FS_WRITE_FILE: 'fs:write-file',
  FS_DELETE_FILE: 'fs:delete-file',
  FS_RENAME: 'fs:rename',
  FS_MKDIR: 'fs:mkdir',

  PROJECT_CREATE: 'project:create',
  PROJECT_LIST: 'project:list',
  PROJECT_DELETE: 'project:delete',
  PROJECT_EXPORT: 'project:export',
  PROJECT_IMPORT: 'project:import',
  PROJECT_TREE_GET: 'project:tree-get',

  FOLDER_CREATE: 'folder:create',
  FOLDER_RENAME: 'folder:rename',
  FOLDER_DELETE: 'folder:delete',
  FOLDER_MOVE: 'folder:move',

  SPEC_FILE_CREATE: 'spec-file:create',
  SPEC_FILE_DELETE: 'spec-file:delete',
  SPEC_FILE_RENAME: 'spec-file:rename',
  SPEC_FILE_MOVE: 'spec-file:move',
  SPEC_TOGGLE_FAVORITE: 'spec-file:toggle-favorite',
  SPEC_LIST_FAVORITES: 'spec-file:list-favorites',

  QUICK_OPEN_LIST: 'quick-open:list',

  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_SET_ACTIVE: 'workspace:set-active',
  WORKSPACE_GET_ACTIVE: 'workspace:get-active',

  SPEC_SAVE: 'spec:save',
  SPEC_VALIDATE: 'spec:validate',
  SPEC_FORMAT: 'spec:format',
  SPEC_DUPLICATE: 'spec:duplicate',
  SPEC_IMPORT: 'spec:import',
  SPEC_EXPORT: 'spec:export',
  PROJECT_EXPORT_ZIP: 'project:export-zip',

  VERSION_CREATE: 'version:create',
  VERSION_LIST: 'version:list',
  VERSION_GET: 'version:get',
  VERSION_RESTORE: 'version:restore',
  VERSION_DELETE: 'version:delete',
  VERSION_DIFF: 'version:diff',

  GIT_AUTH: 'git:auth',
  GIT_LINK: 'git:link',
  GIT_PULL: 'git:pull',
  GIT_PUSH: 'git:push',
  GIT_STATUS: 'git:status',
  GIT_DIFF: 'git:diff',

  VALIDATE_SPEC: 'validate:spec',
  VALIDATE_REALTIME: 'validate:realtime',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  DIALOG_CHOOSE_FOLDER: 'dialog:choose-folder',

  WORKSPACE_EXPORT: 'workspace:export',
  WORKSPACE_IMPORT: 'workspace:import',
  APP_DATA_EXPORT: 'app-data:export',
  APP_DATA_IMPORT: 'app-data:import',
  // Window
  WINDOW_OPEN: 'window:open',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
