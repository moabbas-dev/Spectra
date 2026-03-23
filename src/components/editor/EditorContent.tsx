import { useEditorStore } from '../../stores/editor.store';
import { EditorViewSwitcher } from './EditorViewSwitcher';
import { CodeEditorView } from './views/CodeEditorView';
import { FormEditorView } from './views/FormEditorView';

export function EditorContent() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);

  const active = tabs.find((t) => t.specFileId === activeTabId);

  if (!active) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
        Open a spec from the explorer or press Ctrl+P to quick open.
      </div>
    );
  }

  const view = active.activeView ?? 'code';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorViewSwitcher specFileId={active.specFileId} />
      {view === 'code' ? (
        <CodeEditorView specFileId={active.specFileId} />
      ) : (
        <FormEditorView specFileId={active.specFileId} />
      )}
    </div>
  );
}
