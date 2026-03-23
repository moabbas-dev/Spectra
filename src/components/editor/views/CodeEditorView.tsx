import { useEditorStore } from '../../../stores/editor.store';

interface Props {
  specFileId: string;
}

export function CodeEditorView({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const setTabContent = useEditorStore((s) => s.setTabContent);
  const tab = tabs.find((t) => t.specFileId === specFileId);

  if (!tab) return null;

  return (
    <textarea
      className="min-h-0 w-full flex-1 resize-none border-0 bg-shell-bg p-4 font-mono text-sm text-gray-200 outline-none focus:ring-0"
      spellCheck={false}
      value={tab.content}
      onChange={(e) => setTabContent(specFileId, e.target.value)}
      aria-label={`Code editor: ${tab.title}`}
    />
  );
}
