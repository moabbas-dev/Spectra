import { useState } from 'react';
import {
  FileUp,
  Download,
  FilePlus,
  FolderPlus,
  ChevronsDownUp,
} from 'lucide-react';
import { WorkspaceSelector } from '../sidebar/WorkspaceSelector';
import { ProjectTree } from '../sidebar/ProjectTree';
import { useUiStore } from '../../stores/ui.store';
import { useEditorStore } from '../../stores/editor.store';
import { useProjectsStore } from '../../stores/projects.store';
import { useIPC } from '../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';
import { ImportDialog } from '../dialogs/ImportDialog';
import { ExportDialog } from '../dialogs/ExportDialog';
import { CreateSpecDialog } from '../dialogs/CreateSpecDialog';

export function Sidebar() {
  const ipc = useIPC();
  const panel = useUiStore((s) => s.sidebarPanel);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const projects = useProjectsStore((s) => s.projects);
  const bumpTree = useProjectsStore((s) => s.bumpTree);

  const [importDialog, setImportDialog] = useState<{ projectId: string; folderId: string | null } | null>(null);
  const [exportDialog, setExportDialog] = useState<{ content: string; fileName: string } | null>(null);
  const [specDialog, setSpecDialog] = useState<{ projectId: string; folderId: string | null } | null>(null);

  /* Get the first available project for toolbar actions */
  const firstProjectId = projects[0]?.id ?? null;

  /* Get active tab info for export */
  const activeTab = tabs.find((t) => t.specFileId === activeTabId);

  const handleImportClick = () => {
    if (!firstProjectId) return;
    setImportDialog({ projectId: firstProjectId, folderId: null });
  };

  const handleExportClick = async () => {
    if (!activeTab) return;
    try {
      const { content } = await ipc<{ content: string }>(
        IPC.FS_READ_FILE,
        activeTab.filePath,
      );
      setExportDialog({ content, fileName: activeTab.title });
    } catch (err) {
      console.error('Failed to read file for export:', err);
    }
  };

  const handleNewFileClick = () => {
    if (!firstProjectId) return;
    setSpecDialog({ projectId: firstProjectId, folderId: null });
  };

  /* Toolbar actions */
  const toolbarButtons = [
    {
      icon: FilePlus,
      label: 'New File',
      onClick: handleNewFileClick,
      disabled: !firstProjectId,
    },
    {
      icon: FolderPlus,
      label: 'New Folder',
      onClick: () => {
        if (!firstProjectId) return;
        const name = window.prompt('Folder name');
        if (!name?.trim()) return;
        void ipc(IPC.FOLDER_CREATE, {
          projectId: firstProjectId,
          parentFolderId: null,
          name: name.trim(),
        }).then(() => bumpTree());
      },
      disabled: !firstProjectId,
    },
    {
      icon: FileUp,
      label: 'Import File',
      onClick: handleImportClick,
      disabled: !firstProjectId,
    },
    {
      icon: Download,
      label: 'Export File',
      onClick: () => void handleExportClick(),
      disabled: !activeTab,
    },
    {
      icon: ChevronsDownUp,
      label: 'Collapse All',
      onClick: () => {
        /* collapse all is handled by bumping tree which re-renders */
        bumpTree();
      },
      disabled: false,
    },
  ];

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-shell-border bg-shell-sidebar"
      style={{ width: sidebarWidth }}
      aria-label="Side bar"
    >
      {/* Panel header with toolbar */}
      <div className="flex items-center justify-between border-b border-shell-border px-2 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {panel === 'explorer' && 'Explorer'}
          {panel === 'search' && 'Search'}
          {panel === 'git' && 'Source Control'}
          {panel === 'history' && 'History'}
          {panel === 'favorites' && 'Favorites'}
        </span>
        {panel === 'explorer' && (
          <div className="flex items-center gap-0.5">
            {toolbarButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.label}
                  type="button"
                  className="rounded p-1 text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  title={btn.label}
                  aria-label={btn.label}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {panel === 'explorer' ? (
          <>
            <WorkspaceSelector />
            <ProjectTree />
          </>
        ) : (
          <div className="p-3 text-sm text-gray-500">
            This panel is not implemented yet.
          </div>
        )}
      </div>

      {/* Dialogs triggered by toolbar */}
      {importDialog && (
        <ImportDialog
          projectId={importDialog.projectId}
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

      {specDialog && (
        <CreateSpecDialog
          projectId={specDialog.projectId}
          folderId={specDialog.folderId}
          onClose={() => setSpecDialog(null)}
          onCreated={() => {
            setSpecDialog(null);
            bumpTree();
          }}
        />
      )}
    </aside>
  );
}
