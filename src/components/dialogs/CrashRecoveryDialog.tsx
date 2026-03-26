import { RotateCcw, Trash2, X } from 'lucide-react';

interface CrashRecoveryEntry {
  specFileId: string;
  filePath: string;
  title: string;
  content: string;
}

interface Props {
  entries: CrashRecoveryEntry[];
  onRestore: (entries: CrashRecoveryEntry[]) => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function CrashRecoveryDialog({
  entries,
  onRestore,
  onDiscard,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-shell-border bg-[#252526] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shell-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
              <RotateCcw className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-200">
                Crash Recovery
              </h2>
              <p className="text-xs text-gray-500">
                Unsaved changes detected from a previous session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 transition-colors hover:bg-[#3c3c3c] hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* File list */}
        <div className="max-h-60 overflow-y-auto px-5 py-3">
          <p className="mb-2 text-xs font-medium text-gray-400">
            {entries.length} file{entries.length > 1 ? 's' : ''} with unsaved
            changes:
          </p>
          <ul className="space-y-1.5">
            {entries.map((entry) => (
              <li
                key={entry.specFileId}
                className="flex items-center gap-2 rounded-md bg-[#2d2d2d] px-3 py-2"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span
                  className="truncate text-xs text-gray-300"
                  title={entry.filePath}
                >
                  {entry.title}
                </span>
                <span className="ml-auto text-[10px] text-gray-600">
                  modified
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-shell-border px-5 py-3">
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-3 w-3" />
            Discard All
          </button>
          <button
            type="button"
            onClick={() => onRestore(entries)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
          >
            <RotateCcw className="h-3 w-3" />
            Restore All
          </button>
        </div>
      </div>
    </div>
  );
}

export type { CrashRecoveryEntry };
