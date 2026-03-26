import { History, Clock } from 'lucide-react';

interface Props {
  specFileId: string;
}

/**
 * History / version timeline view placeholder.
 * Full implementation with version IPC comes in Sprint 13-14.
 */
export function HistoryView({ specFileId: _specFileId }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
        <History className="h-8 w-8 text-purple-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-300">
          Version History
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-xs">
          Track changes, compare versions, and restore previous states of your
          spec files. This feature is coming soon.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-[#2a2a2a] border border-shell-border px-4 py-2.5">
        <Clock className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-[11px] text-gray-500">
          Version snapshots, diff viewer, and restore will be available here
        </span>
      </div>
    </div>
  );
}
