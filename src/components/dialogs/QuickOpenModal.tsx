import { useEffect, useMemo, useRef, useState } from 'react';
import { IPC } from '@shared/ipc-channels';
import type { QuickOpenEntry } from '@shared/ipc-payloads';
import { useIPC } from '../../hooks/useIPC';
import { useEditorStore } from '../../stores/editor.store';
import { useUiStore } from '../../stores/ui.store';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function QuickOpenModal() {
  const ipc = useIPC();
  const open = useUiStore((s) => s.quickOpenOpen);
  const setQuickOpenOpen = useUiStore((s) => s.setQuickOpenOpen);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openOrFocusTab = useEditorStore((s) => s.openOrFocusTab);

  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<QuickOpenEntry[]>([]);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !activeWorkspaceId) return;
    let cancelled = false;
    void (async () => {
      const list = await ipc<QuickOpenEntry[]>(
        IPC.QUICK_OPEN_LIST,
        activeWorkspaceId,
      );
      if (!cancelled) {
        setEntries(list);
        setQuery('');
        setHighlight(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, activeWorkspaceId, ipc]);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.filePath.toLowerCase().includes(q) ||
        e.projectName.toLowerCase().includes(q),
    );
  }, [entries, query]);

  async function pick(entry: QuickOpenEntry) {
    const { content } = await ipc<{ content: string }>(
      IPC.FS_READ_FILE,
      entry.filePath,
    );
    openOrFocusTab({
      specFileId: entry.specFileId,
      filePath: entry.filePath,
      title: `${entry.projectName} / ${entry.name}`,
      content,
      dirty: false,
    });
    setQuickOpenOpen(false);
  }

  if (!open) return null;

  if (!activeWorkspaceId) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24"
        role="dialog"
        aria-modal="true"
        aria-label="Quick open"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setQuickOpenOpen(false);
        }}
      >
        <div className="w-full max-w-lg rounded-md border border-shell-border bg-shell-sidebar px-4 py-3 text-sm text-gray-400 shadow-xl">
          Select a workspace first, then press Ctrl+P again.
          <button
            type="button"
            className="mt-2 block text-xs text-blue-400 hover:underline"
            onClick={() => setQuickOpenOpen(false)}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Quick open"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setQuickOpenOpen(false);
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-md border border-shell-border bg-shell-sidebar shadow-xl">
        <input
          ref={inputRef}
          className="w-full border-b border-shell-border bg-shell-bg px-3 py-2 text-sm text-gray-100 outline-none"
          placeholder="Search spec files…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setQuickOpenOpen(false);
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            }
            if (e.key === 'Enter' && filtered[highlight]) {
              e.preventDefault();
              void pick(filtered[highlight]);
            }
          }}
        />
        <ul className="max-h-72 overflow-y-auto text-xs">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">No matches</li>
          ) : (
            filtered.map((ent, i) => (
              <li key={ent.specFileId}>
                <button
                  type="button"
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-shell-hover ${
                    i === highlight ? 'bg-shell-active' : ''
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => void pick(ent)}
                >
                  <span className="text-gray-200">{ent.name}</span>
                  <span className="truncate text-[10px] text-gray-500">
                    {ent.projectName} · {ent.filePath}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
