import { useCallback, useEffect, useState, type DragEvent, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { IPC } from '@shared/ipc-channels';
import type { FolderRow, ProjectTreeSnapshot, SpecFileRow } from '@shared/ipc-payloads';
import { useIPC } from '../../hooks/useIPC';
import { useEditorStore } from '../../stores/editor.store';
import { useProjectsStore } from '../../stores/projects.store';
import { CreateSpecDialog } from '../dialogs/CreateSpecDialog';

interface ExplorerTreeProps {
  projectId: string;
}

type MenuState =
  | {
      x: number;
      y: number;
      items: { label: string; onClick: () => void; danger?: boolean }[];
    }
  | null;

/* Drag-and-drop data transfer keys */
const DRAG_TYPE_FOLDER = 'spectra/folder-id';
const DRAG_TYPE_FILE = 'spectra/file-id';

export function ExplorerTree({ projectId }: ExplorerTreeProps) {
  const ipc = useIPC();
  const treeRevision = useProjectsStore((s) => s.treeRevision);
  const bumpTree = useProjectsStore((s) => s.bumpTree);
  const openOrFocusTab = useEditorStore((s) => s.openOrFocusTab);

  const [tree, setTree] = useState<ProjectTreeSnapshot | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuState>(null);
  const [specDialog, setSpecDialog] = useState<{
    folderId: string | null;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // folderId or '__root__'

  const loadTree = useCallback(async () => {
    const snap = await ipc<ProjectTreeSnapshot>(IPC.PROJECT_TREE_GET, projectId);
    setTree(snap);
    setExpanded((prev) => {
      const next = { ...prev };
      for (const f of snap.folders) {
        if (next[f.id] === undefined) next[f.id] = true;
      }
      return next;
    });
  }, [ipc, projectId]);

  useEffect(() => {
    void loadTree();
  }, [loadTree, treeRevision]);

  useEffect(() => {
    function close() {
      setMenu(null);
    }
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const toggleFolder = (id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  };

  async function openFile(file: SpecFileRow) {
    const { content } = await ipc<{ content: string }>(
      IPC.FS_READ_FILE,
      file.filePath,
    );
    openOrFocusTab({
      specFileId: file.id,
      filePath: file.filePath,
      title: file.name,
      content,
      dirty: false,
    });
  }

  async function createFolder(parentFolderId: string | null) {
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    await ipc(IPC.FOLDER_CREATE, {
      projectId,
      parentFolderId,
      name: name.trim(),
    });
    bumpTree();
  }

  async function renameFolder(folder: FolderRow) {
    const name = window.prompt('New folder name', folder.name);
    if (!name?.trim() || name.trim() === folder.name) return;
    await ipc(IPC.FOLDER_RENAME, {
      folderId: folder.id,
      name: name.trim(),
    });
    bumpTree();
  }

  async function deleteFolder(folder: FolderRow) {
    if (!window.confirm(`Delete folder "${folder.name}" and its contents?`)) return;
    await ipc(IPC.FOLDER_DELETE, folder.id);
    bumpTree();
  }

  async function deleteFile(file: SpecFileRow) {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    await ipc(IPC.SPEC_FILE_DELETE, file.id);
    useEditorStore.getState().closeTab(file.id);
    bumpTree();
  }

  async function renameFile(file: SpecFileRow) {
    const name = window.prompt('New file name (without extension)', file.name);
    if (!name?.trim() || name.trim() === file.name) return;
    await ipc(IPC.SPEC_FILE_RENAME, {
      specFileId: file.id,
      name: name.trim(),
    });
    bumpTree();
  }

  /* ── Drag-and-drop handlers ── */
  function onDragStartFolder(e: DragEvent, folder: FolderRow) {
    e.stopPropagation();
    e.dataTransfer.setData(DRAG_TYPE_FOLDER, folder.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragStartFile(e: DragEvent, file: SpecFileRow) {
    e.stopPropagation();
    e.dataTransfer.setData(DRAG_TYPE_FILE, file.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetId);
  }

  function onDragLeave(e: DragEvent) {
    e.stopPropagation();
    setDropTarget(null);
  }

  async function onDrop(e: DragEvent, targetFolderId: string | null) {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);

    const folderId = e.dataTransfer.getData(DRAG_TYPE_FOLDER);
    const fileId = e.dataTransfer.getData(DRAG_TYPE_FILE);

    if (folderId) {
      // Don't drop a folder into itself
      if (folderId === targetFolderId) return;
      try {
        await ipc(IPC.FOLDER_MOVE, {
          folderId,
          newParentFolderId: targetFolderId,
        });
        bumpTree();
      } catch (err) {
        console.error('Folder move failed:', err);
      }
    } else if (fileId) {
      try {
        await ipc(IPC.SPEC_FILE_MOVE, {
          specFileId: fileId,
          newFolderId: targetFolderId,
        });
        bumpTree();
      } catch (err) {
        console.error('File move failed:', err);
      }
    }
  }

  /* ── Context menu builders ── */
  function onProjectRootContext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'New folder',
          onClick: () => void createFolder(null),
        },
        {
          label: 'New OpenAPI file…',
          onClick: () => setSpecDialog({ folderId: null }),
        },
      ],
    });
  }

  function onFolderContext(e: React.MouseEvent, folder: FolderRow) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'New folder',
          onClick: () => void createFolder(folder.id),
        },
        {
          label: 'New OpenAPI file…',
          onClick: () => setSpecDialog({ folderId: folder.id }),
        },
        {
          label: 'Rename',
          onClick: () => void renameFolder(folder),
        },
        {
          label: 'Delete',
          danger: true,
          onClick: () => void deleteFolder(folder),
        },
      ],
    });
  }

  function onFileContext(e: React.MouseEvent, file: SpecFileRow) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'Open',
          onClick: () => void openFile(file),
        },
        {
          label: 'Rename',
          onClick: () => void renameFile(file),
        },
        {
          label: 'Delete',
          danger: true,
          onClick: () => void deleteFile(file),
        },
      ],
    });
  }

  if (!tree) {
    return <p className="px-2 py-1 text-xs text-gray-500">Loading tree…</p>;
  }

  const rootFolders = tree.folders.filter((f) => !f.parentFolderId);
  const rootFiles = tree.files.filter((f) => !f.folderId);

  function renderFolder(folder: FolderRow, depth: number): ReactNode {
    const open = expanded[folder.id] ?? true;
    const children = tree!.folders.filter((f) => f.parentFolderId === folder.id);
    const filesHere = tree!.files.filter((f) => f.folderId === folder.id);
    const isDropTarget = dropTarget === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-xs text-gray-300 hover:bg-shell-hover ${
            isDropTarget ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
          }`}
          style={{ paddingLeft: 4 + depth * 12 }}
          draggable
          onDragStart={(e) => onDragStartFolder(e, folder)}
          onDragOver={(e) => onDragOver(e, folder.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => void onDrop(e, folder.id)}
          onContextMenu={(e) => onFolderContext(e, folder)}
          onClick={() => toggleFolder(folder.id)}
          onDoubleClick={() => toggleFolder(folder.id)}
        >
          <span className="shrink-0 text-gray-500">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-600/90" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-amber-600/90" />
          )}
          <span className="truncate">{folder.name}</span>
        </div>
        {open ? (
          <div>
            {children.map((ch) => renderFolder(ch, depth + 1))}
            {filesHere.map((file) => (
              <button
                key={file.id}
                type="button"
                className="flex w-full cursor-pointer items-center gap-1 rounded py-0.5 pl-6 pr-1 text-left text-xs text-gray-400 hover:bg-shell-hover hover:text-gray-200"
                style={{ paddingLeft: 8 + (depth + 1) * 12 }}
                draggable
                onDragStart={(e) => onDragStartFile(e, file)}
                onContextMenu={(e) => onFileContext(e, file)}
                onClick={() => void openFile(file)}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400/90" />
                <span className="truncate">
                  {file.name}
                  {file.filePath.toLowerCase().endsWith('.json')
                    ? '.json'
                    : '.yaml'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const isRootDropTarget = dropTarget === '__root__';

  return (
    <div
      className={`border-t border-shell-border px-1 py-1 ${
        isRootDropTarget ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
      }`}
      onContextMenu={onProjectRootContext}
      onDragOver={(e) => onDragOver(e, '__root__')}
      onDragLeave={onDragLeave}
      onDrop={(e) => void onDrop(e, null)}
    >
      <div className="mb-1 px-1 text-[10px] font-semibold uppercase text-gray-500">
        Files
      </div>
      {rootFolders.map((f) => renderFolder(f, 0))}
      {rootFiles.map((file) => (
        <button
          key={file.id}
          type="button"
          className="flex w-full cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left text-xs text-gray-400 hover:bg-shell-hover hover:text-gray-200"
          style={{ paddingLeft: 8 }}
          draggable
          onDragStart={(e) => onDragStartFile(e, file)}
          onContextMenu={(e) => onFileContext(e, file)}
          onClick={() => void openFile(file)}
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400/90" />
          <span className="truncate">
            {file.name}
            {file.filePath.toLowerCase().endsWith('.json') ? '.json' : '.yaml'}
          </span>
        </button>
      ))}
      {rootFolders.length === 0 && rootFiles.length === 0 ? (
        <p className="px-1 text-xs text-gray-500">
          Right-click here for new folder or spec file.
        </p>
      ) : null}

      {menu ? (
        <div
          className="fixed z-[100] min-w-[160px] rounded border border-shell-border bg-shell-sidebar py-0.5 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {menu.items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-shell-hover ${
                item.danger ? 'text-red-400' : 'text-gray-200'
              }`}
              onClick={() => {
                setMenu(null);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {specDialog ? (
        <CreateSpecDialog
          projectId={projectId}
          folderId={specDialog.folderId}
          onClose={() => setSpecDialog(null)}
          onCreated={() => {
            setSpecDialog(null);
            bumpTree();
          }}
        />
      ) : null}

    </div>
  );
}
