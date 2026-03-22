import { X } from 'lucide-react';
import { useEditorStore } from '../../stores/editor.store';

export function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className="flex min-h-0 shrink-0 gap-0.5 overflow-x-auto border-b border-shell-border bg-shell-sidebar px-1 pt-1"
      role="tablist"
      aria-label="Open files"
    >
      {tabs.map((t) => {
        const active = t.specFileId === activeTabId;
        return (
          <div
            key={t.specFileId}
            role="tab"
            aria-selected={active}
            className={`group flex max-w-[200px] shrink-0 items-center gap-1 rounded-t border border-b-0 px-2 py-1 text-xs ${
              active
                ? 'border-shell-border bg-shell-bg text-gray-100'
                : 'border-transparent text-gray-500 hover:bg-shell-hover hover:text-gray-300'
            }`}
          >
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left"
              onClick={() => setActiveTab(t.specFileId)}
              title={t.filePath}
            >
              {t.dirty ? (
                <span className="text-amber-400" aria-hidden>
                  •{' '}
                </span>
              ) : null}
              {t.title}
            </button>
            <button
              type="button"
              className="rounded p-0.5 opacity-60 hover:bg-shell-active hover:opacity-100"
              aria-label={`Close ${t.title}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(t.specFileId);
              }}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
