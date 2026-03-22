import { useEditorStore } from '../../stores/editor.store';

export function EditorContent() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setTabContent = useEditorStore((s) => s.setTabContent);

  const active = tabs.find((t) => t.specFileId === activeTabId);

  if (!active) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
        Open a spec from the explorer or press Ctrl+P to quick open.
      </div>
    );
  }

  return (
    <textarea
      className="min-h-0 w-full flex-1 resize-none border-0 bg-shell-bg p-4 font-mono text-sm text-gray-200 outline-none focus:ring-0"
      spellCheck={false}
      value={active.content}
      onChange={(e) => setTabContent(active.specFileId, e.target.value)}
      aria-label={`Editor: ${active.title}`}
    />
  );
}
