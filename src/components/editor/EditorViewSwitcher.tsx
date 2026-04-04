import { FileText, Code2, Eye, History } from 'lucide-react';
import { useEditorStore, type EditorView } from '../../stores/editor.store';

interface Props {
  specFileId: string;
}

const views: { key: EditorView; label: string; icon: typeof FileText }[] = [
  { key: 'form', label: 'Form', icon: FileText },
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'history', label: 'History', icon: History },
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
        const Icon = v.icon;
        return (
          <button
            key={v.key}
            role="tab"
            type="button"
            aria-selected={active}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'text-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveView(specFileId, v.key)}
          >
            <Icon className="h-3.5 w-3.5" />
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

