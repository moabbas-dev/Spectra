import { useEditorStore, type EditorView } from '../../stores/editor.store';
import { EditorViewSwitcher } from './EditorViewSwitcher';
import { CodeEditorView } from './views/CodeEditorView';
import { FormEditorView } from './views/FormEditorView';
import { PreviewView } from './views/PreviewView';
import { HistoryView } from './views/HistoryView';
import { ValidateView } from './views/ValidateView';

function ViewRenderer({ view, specFileId }: { view: EditorView; specFileId: string }) {
  switch (view) {
    case 'form':
      return <FormEditorView specFileId={specFileId} />;
    case 'code':
      return <CodeEditorView specFileId={specFileId} />;
    case 'preview':
      return <PreviewView specFileId={specFileId} />;
    case 'history':
      return <HistoryView specFileId={specFileId} />;
    case 'validate':
      return <ValidateView specFileId={specFileId} />;
    default:
      return <CodeEditorView specFileId={specFileId} />;
  }
}

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
      <ViewRenderer view={view} specFileId={active.specFileId} />
    </div>
  );
}

