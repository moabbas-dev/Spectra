import { useState, useCallback } from 'react';
import { Tag, X, Loader2, Save } from 'lucide-react';
import { useIPC } from '../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';
import type { SpecVersionRow } from '@shared/ipc-payloads';

interface Props {
  specFileId: string;
  onClose: () => void;
  onCreated: (version: SpecVersionRow) => void;
}

export function CreateVersionModal({ specFileId, onClose, onCreated }: Props) {
  const ipc = useIPC();
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const version = await ipc<SpecVersionRow>(IPC.VERSION_CREATE, {
        specFileId,
        label: label.trim() || undefined,
      });
      onCreated(version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
    } finally {
      setSaving(false);
    }
  }, [ipc, specFileId, label, onCreated]);

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
            <Save className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-gray-200">Create Version Snapshot</h2>
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
          <p className="text-xs text-gray-400">
            Save a snapshot of the current file state. You can restore this version at any time.
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Version label (optional)
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. v2.0-auth-overhaul"
              className="rounded border border-shell-border bg-shell-bg px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-purple-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
              }}
            />
          </label>

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
              disabled={saving}
              onClick={() => void handleCreate()}
              className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Create Snapshot
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
