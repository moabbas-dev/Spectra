import { FileText, Code2 } from 'lucide-react';
import { useEditorStore, type EditorView } from '../../stores/editor.store';

interface Props {
  specFileId: string;
}

const views: { key: EditorView; label: string; icon: typeof FileText }[] = [
  { key: 'form', label: '📝 Form', icon: FileText },
  { key: 'code', label: '</> Code', icon: Code2 },
];

export function EditorViewSwitcher({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const setActiveView = useEditorStore((s) => s.setActiveView);
  const tab = tabs.find((t) => t.specFileId === specFileId);
  const current = tab?.activeView ?? 'code';

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 border-b border-shell-border bg-[#2d2d2d] px-2"
      role="tablist"
      aria-label="Editor view switcher"
    >
      {views.map((v) => {
        const active = current === v.key;
        return (
          <button
            key={v.key}
            role="tab"
            type="button"
            aria-selected={active}
            className={`relative px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'text-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveView(specFileId, v.key)}
          >
            {v.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
