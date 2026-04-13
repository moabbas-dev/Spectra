import { useState, useRef, useEffect } from 'react';
import { Download, FileUp, HardDriveDownload, HardDriveUpload, Database, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { IPC } from '@shared/ipc-channels';
import { useIPC } from '../../hooks/useIPC';

interface Props {
  onImportFile: () => void;
  onExportFile: () => void;
  activeWorkspaceId: string | null;
  hasActiveTab: boolean;
}

export function ImportExportMenu({ onImportFile, onExportFile, activeWorkspaceId, hasActiveTab }: Props) {
  const ipc = useIPC();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleWorkspaceExport() {
    if (!activeWorkspaceId) return;
    try {
      await ipc(IPC.WORKSPACE_EXPORT, activeWorkspaceId);
    } catch (err) {
      console.error('Workspace export failed:', err);
    }
    setOpen(false);
  }

  async function handleWorkspaceImport() {
    try {
      await ipc(IPC.WORKSPACE_IMPORT);
      // Workspace refresh will be handled via events or user reloading context
    } catch (err) {
      console.error('Workspace import failed:', err);
    }
    setOpen(false);
  }

  async function handleAppDataExport() {
    try {
      await ipc(IPC.APP_DATA_EXPORT);
    } catch (err) {
      console.error('App data export failed:', err);
    }
    setOpen(false);
  }

  async function handleAppDataImport() {
    try {
      await ipc(IPC.APP_DATA_IMPORT);
    } catch (err) {
      console.error('App data import failed:', err);
    }
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        className={`rounded p-1 text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors ${open ? 'bg-shell-hover text-gray-300' : ''}`}
        onClick={() => setOpen(!open)}
        title="Import / Export Data"
        aria-label="Import / Export Data"
      >
        <Database className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded border border-shell-border bg-shell-sidebar py-1 shadow-xl">
          <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-shell-border/40">Import</div>
          
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-shell-hover disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { setOpen(false); onImportFile(); }}
            disabled={!activeWorkspaceId}
          >
            <FileUp className="h-3 w-3 shrink-0" />
            <span>Import Spec File</span>
          </button>
          
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-shell-hover"
            onClick={() => void handleWorkspaceImport()}
          >
            <ArrowDownToLine className="h-3 w-3 shrink-0" />
            <span>Import Workspace</span>
          </button>
          
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-shell-hover"
            onClick={() => void handleAppDataImport()}
          >
            <HardDriveDownload className="h-3 w-3 shrink-0" />
            <span>Import Entire App Data</span>
          </button>

          <div className="mt-1 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-t border-shell-border/40 bg-shell-bg/50">Export</div>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-shell-hover disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { setOpen(false); onExportFile(); }}
            disabled={!hasActiveTab}
          >
            <Download className="h-3 w-3 shrink-0" />
            <span>Export Current File</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-shell-hover disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => void handleWorkspaceExport()}
            disabled={!activeWorkspaceId}
          >
            <ArrowUpToLine className="h-3 w-3 shrink-0" />
            <span>Export Workspace</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-shell-hover"
            onClick={() => void handleAppDataExport()}
          >
            <HardDriveUpload className="h-3 w-3 shrink-0" />
            <span>Export Entire App Data</span>
          </button>
        </div>
      )}
    </div>
  );
}
