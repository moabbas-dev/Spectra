import { useState, useCallback } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { useIPC } from '../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';
import { useValidationStore } from '../../stores/validation.store';

interface Props {
  content: string;
  fileName: string;
  onClose: () => void;
}

/**
 * Export dialog — exports the active spec file as YAML or JSON.
 * Shows validation warning if the file has errors.
 */
export function ExportDialog({ content, fileName, onClose }: Props) {
  const ipc = useIPC();
  const issues = useValidationStore((s) => s.issues);
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const doExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await ipc<{ success: boolean; filePath?: string }>(
        IPC.SPEC_EXPORT,
        { content, defaultName: fileName, format },
      );
      if (res.success) {
        setSuccess(`Exported to ${res.filePath}`);
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [ipc, content, fileName, format, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[380px] rounded-lg border border-shell-border bg-shell-sidebar shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shell-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-green-400" />
            <h2 className="text-sm font-semibold text-gray-200">Export Spec</h2>
          </div>
          <button
            type="button"
            className="rounded p-1 text-gray-500 hover:bg-shell-hover hover:text-gray-300"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* File info */}
          <div className="rounded bg-[#2a2a2a] px-3 py-2 text-xs">
            <span className="text-gray-400">File: </span>
            <span className="text-gray-200 font-medium">{fileName}</span>
          </div>

          {/* Validation gate */}
          {errorCount > 0 && (
            <div className="rounded bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              ⚠ This file has {errorCount} validation error{errorCount > 1 ? 's' : ''}.
              Consider fixing before exporting.
            </div>
          )}
          {warningCount > 0 && errorCount === 0 && (
            <div className="rounded bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-400">
              This file has {warningCount} warning{warningCount > 1 ? 's' : ''}.
            </div>
          )}

          {/* Format picker */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Export format</span>
            <div className="flex gap-2">
              {(['yaml', 'json'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`flex-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                    format === f
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-shell-border text-gray-400 hover:bg-shell-hover'
                  }`}
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded px-3 py-1.5 text-xs text-gray-400 hover:bg-shell-hover hover:text-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={doExport}
              className="flex items-center gap-1.5 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
            >
              {exporting && <Loader2 className="h-3 w-3 animate-spin" />}
              Export as {format.toUpperCase()}
            </button>
          </div>

          {success && (
            <p className="text-xs text-green-400">{success}</p>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
