import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '../../stores/editor.store';

interface CtxMenu {
  x: number;
  y: number;
  specFileId: string;
}

export function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const closeOtherTabs = useEditorStore((s) => s.closeOtherTabs);
  const closeAllTabs = useEditorStore((s) => s.closeAllTabs);

  const [ctx, setCtx] = useState<CtxMenu | null>(null);

  const dismiss = useCallback(() => setCtx(null), []);

  useEffect(() => {
    if (!ctx) return;
    window.addEventListener('click', dismiss);
    window.addEventListener('contextmenu', dismiss);
    return () => {
      window.removeEventListener('click', dismiss);
      window.removeEventListener('contextmenu', dismiss);
    };
  }, [ctx, dismiss]);

  if (tabs.length === 0) {
    return null;
  }

  function handleContext(e: MouseEvent, specFileId: string) {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, specFileId });
  }

  function copyPath(specFileId: string) {
    const tab = tabs.find((t) => t.specFileId === specFileId);
    if (tab) {
      void navigator.clipboard.writeText(tab.filePath);
    }
  }

  return (
    <>
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
              onContextMenu={(e) => handleContext(e, t.specFileId)}
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

      {ctx ? (
        <div
          className="fixed z-[200] min-w-[180px] rounded border border-shell-border bg-shell-sidebar py-0.5 shadow-lg"
          style={{ left: ctx.x, top: ctx.y }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {[
            {
              label: 'Close',
              action: () => closeTab(ctx.specFileId),
            },
            {
              label: 'Close Others',
              action: () => closeOtherTabs(ctx.specFileId),
              disabled: tabs.length <= 1,
            },
            {
              label: 'Close All',
              action: () => closeAllTabs(),
            },
            { separator: true as const },
            {
              label: 'Copy Path',
              action: () => copyPath(ctx.specFileId),
            },
          ].map((item, i) =>
            'separator' in item ? (
              <div
                key={`sep-${i}`}
                className="my-0.5 border-t border-shell-border"
              />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={'disabled' in item && item.disabled}
                className="block w-full px-3 py-1.5 text-left text-xs text-gray-200 hover:bg-shell-hover disabled:opacity-40"
                onClick={() => {
                  setCtx(null);
                  item.action?.();
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </>
  );
}
