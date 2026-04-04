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
import { ImportDialog } from '../dialogs/ImportDialog';
import { ExportDialog } from '../dialogs/ExportDialog';

interface ExplorerTreeProps {
  projectId: string;
}

type MenuState =
  | {
      x: number;
      y: number;
      items: { label: string; onClick: () => void; danger?: boolean; separator?: boolean }[];
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
  const activeTabId = useEditorStore((s) => s.activeTabId);

  const [tree, setTree] = useState<ProjectTreeSnapshot | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuState>(null);
  const [specDialog, setSpecDialog] = useState<{
    folderId: string | null;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // folderId or '__root__'
  const [importDialog, setImportDialog] = useState<{ folderId: string | null } | null>(null);
  const [exportDialog, setExportDialog] = useState<{ content: string; fileName: string } | null>(null);

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
          label: 'New File…',
          onClick: () => setSpecDialog({ folderId: null }),
        },
        {
          label: 'New Folder…',
          onClick: () => void createFolder(null),
        },
        {
          label: 'Import File…',
          onClick: () => setImportDialog({ folderId: null }),
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
          label: 'New File…',
          onClick: () => setSpecDialog({ folderId: folder.id }),
        },
        {
          label: 'New Folder…',
          onClick: () => void createFolder(folder.id),
        },
        {
          label: 'Import File…',
          onClick: () => setImportDialog({ folderId: folder.id }),
        },
        { label: '', onClick: () => {}, separator: true },
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
          label: 'Export File…',
          onClick: async () => {
            try {
              const { content } = await ipc<{ content: string }>(
                IPC.FS_READ_FILE,
                file.filePath,
              );
              setExportDialog({ content, fileName: file.name });
            } catch (err) {
              console.error('Failed to read file for export:', err);
            }
          },
        },
        { label: '', onClick: () => {}, separator: true },
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
    return <p className="px-3 py-1 text-xs text-gray-500">Loading…</p>;
  }

  const rootFolders = tree.folders.filter((f) => !f.parentFolderId);
  const rootFiles = tree.files.filter((f) => !f.folderId);

  /* ── Indent guide rendering helper ── */
  function IndentGuides({ depth }: { depth: number }) {
    if (depth === 0) return null;
    return (
      <>
        {Array.from({ length: depth }, (_, i) => (
          <span
            key={i}
            className="inline-block w-4 shrink-0 border-r border-shell-border/40"
            style={{ marginLeft: i === 0 ? 4 : 0 }}
          />
        ))}
      </>
    );
  }

  function renderFolder(folder: FolderRow, depth: number): ReactNode {
    const open = expanded[folder.id] ?? true;
    const children = tree!.folders.filter((f) => f.parentFolderId === folder.id);
    const filesHere = tree!.files.filter((f) => f.folderId === folder.id);
    const isDropTarget = dropTarget === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex cursor-pointer items-center h-[22px] text-xs text-gray-300 hover:bg-shell-hover ${
            isDropTarget ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
          }`}
          draggable
          onDragStart={(e) => onDragStartFolder(e, folder)}
          onDragOver={(e) => onDragOver(e, folder.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => void onDrop(e, folder.id)}
          onContextMenu={(e) => onFolderContext(e, folder)}
          onClick={() => toggleFolder(folder.id)}
        >
          <IndentGuides depth={depth} />
          <span className="shrink-0 text-gray-500 ml-0.5">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/80 mr-1" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500/80 mr-1" />
          )}
          <span className="truncate">{folder.name}</span>
        </div>
        {open && (
          <div>
            {children.map((ch) => renderFolder(ch, depth + 1))}
            {filesHere.map((file) => renderFileNode(file, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  function renderFileNode(file: SpecFileRow, depth: number): ReactNode {
    const isActive = activeTabId === file.id;
    return (
      <button
        key={file.id}
        type="button"
        className={`flex w-full cursor-pointer items-center h-[22px] text-left text-xs transition-colors ${
          isActive
            ? 'bg-blue-500/10 text-gray-100'
            : 'text-gray-400 hover:bg-shell-hover hover:text-gray-200'
        }`}
        draggable
        onDragStart={(e) => onDragStartFile(e, file)}
        onContextMenu={(e) => onFileContext(e, file)}
        onClick={() => void openFile(file)}
      >
        <IndentGuides depth={depth} />
        <span className="w-4 shrink-0" /> {/* chevron spacer to align with folders */}
        <FileText className={`h-3.5 w-3.5 shrink-0 mr-1 ${isActive ? 'text-blue-400' : 'text-blue-400/70'}`} />
        <span className="truncate">
          {file.name}
          {file.filePath.toLowerCase().endsWith('.json') ? '.json' : '.yaml'}
        </span>
      </button>
    );
  }

  const isRootDropTarget = dropTarget === '__root__';

  return (
    <div
      className={`min-h-[24px] py-0.5 ${
        isRootDropTarget ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
      }`}
      onContextMenu={onProjectRootContext}
      onDragOver={(e) => onDragOver(e, '__root__')}
      onDragLeave={onDragLeave}
      onDrop={(e) => void onDrop(e, null)}
    >
      {rootFolders.map((f) => renderFolder(f, 0))}
      {rootFiles.map((file) => renderFileNode(file, 0))}
      {rootFolders.length === 0 && rootFiles.length === 0 && (
        <p className="px-3 py-1 text-[10px] text-gray-600 italic">
          Right-click to add files
        </p>
      )}

      {menu && (
        <div
          className="fixed z-[100] min-w-[160px] rounded border border-shell-border bg-shell-sidebar py-0.5 shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {menu.items.map((item, idx) =>
            item.separator ? (
              <div key={idx} className="my-0.5 h-px bg-shell-border/60 mx-2" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`block w-full px-3 py-1 text-left text-xs hover:bg-shell-hover ${
                  item.danger ? 'text-red-400' : 'text-gray-200'
                }`}
                onClick={() => {
                  setMenu(null);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}

      {specDialog && (
        <CreateSpecDialog
          projectId={projectId}
          folderId={specDialog.folderId}
          onClose={() => setSpecDialog(null)}
          onCreated={() => {
            setSpecDialog(null);
            bumpTree();
          }}
        />
      )}

      {importDialog && (
        <ImportDialog
          projectId={projectId}
          folderId={importDialog.folderId}
          onClose={() => setImportDialog(null)}
          onImported={() => {
            setImportDialog(null);
            bumpTree();
          }}
        />
      )}

      {exportDialog && (
        <ExportDialog
          content={exportDialog.content}
          fileName={exportDialog.fileName}
          onClose={() => setExportDialog(null)}
        />
      )}
    </div>
  );
}
