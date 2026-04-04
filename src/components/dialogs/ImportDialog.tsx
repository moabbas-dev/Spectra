import { useState, useCallback } from 'react';
import { FileUp, X, FileText, Loader2 } from 'lucide-react';
import { useIPC } from '../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';
import { useEditorStore } from '../../stores/editor.store';
import { useProjectsStore } from '../../stores/projects.store';

interface ImportResult {
  fileName: string;
  content: string;
  openapiVersion: string;
  format: 'yaml' | 'json';
}

interface Props {
  projectId: string;
  folderId: string | null;
  onClose: () => void;
  onImported: () => void;
}

/**
 * Import dialog — triggers native file picker, then creates a spec file
 * from the imported content.
 */
export function ImportDialog({ projectId, folderId, onClose, onImported }: Props) {
  const ipc = useIPC();
  const openOrFocusTab = useEditorStore((s) => s.openOrFocusTab);
  const bumpTree = useProjectsStore((s) => s.bumpTree);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  const pickFile = useCallback(async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await ipc<ImportResult | null>(IPC.SPEC_IMPORT);
      if (!res) {
        setImporting(false);
        return; // User cancelled
      }
      setResult(res);
      setCustomName(res.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [ipc]);

  const confirmImport = useCallback(async () => {
    if (!result) return;
    setImporting(true);
    try {
      // Create the spec file in the project
      const spec = await ipc<{ id: string; filePath: string }>(
        IPC.SPEC_FILE_CREATE,
        {
          projectId,
          folderId,
          name: customName || result.fileName,
          openapiVersion: result.openapiVersion.startsWith('2') ? '2.0' : result.openapiVersion.startsWith('3.1') ? '3.1' : '3.0',
        },
      );

      // Write the imported content
      await ipc(IPC.FS_WRITE_FILE, {
        path: spec.filePath,
        content: result.content,
      });

      // Open the file in the editor
      openOrFocusTab({
        specFileId: spec.id,
        filePath: spec.filePath,
        title: customName || result.fileName,
        content: result.content,
        dirty: false,
      });

      bumpTree();
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [ipc, result, customName, projectId, folderId, openOrFocusTab, bumpTree, onImported]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-lg border border-shell-border bg-shell-sidebar shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shell-border px-4 py-3">
          <div className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-200">Import Spec File</h2>
          </div>
          <button
            type="button"
            className="rounded p-1 text-gray-500 hover:bg-shell-hover hover:text-gray-300"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!result ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-xs text-gray-400 text-center">
                Import an existing OpenAPI/Swagger spec file (YAML or JSON).
                <br />
                The version will be auto-detected.
              </p>
              <button
                type="button"
                disabled={importing}
                onClick={pickFile}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                Choose File…
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* File preview */}
              <div className="flex items-center gap-2 rounded bg-[#2a2a2a] px-3 py-2">
                <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">
                    {result.fileName}.{result.format}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {result.format.toUpperCase()} • OpenAPI {result.openapiVersion}
                  </p>
                </div>
              </div>

              {/* Custom name */}
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">File name</span>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter file name"
                />
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded px-3 py-1.5 text-xs text-gray-400 hover:bg-shell-hover hover:text-gray-200"
                  onClick={() => setResult(null)}
                >
                  Choose Different
                </button>
                <button
                  type="button"
                  disabled={importing || !customName.trim()}
                  onClick={confirmImport}
                  className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {importing && <Loader2 className="h-3 w-3 animate-spin" />}
                  Import
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
