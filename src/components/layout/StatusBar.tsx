import { useWorkspaceStore } from '../../stores/workspace.store';
import { useEditorStore } from '../../stores/editor.store';
import { Circle } from 'lucide-react';

export function StatusBar() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.specFileId === activeTabId);

  return (
    <footer
      className="flex h-6 shrink-0 items-center gap-4 border-t border-shell-border bg-blue-900/40 px-2 text-[11px] text-gray-300"
      role="status"
    >
      <span className="font-medium">Spectra</span>
      <span className="text-gray-500">|</span>
      <span>{active ? active.name : 'No workspace'}</span>

      {activeTab && (
        <>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-1">
            {activeTab.dirty && (
              <span title="Unsaved changes">
                <Circle className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              </span>
            )}
            {activeTab.title}
          </span>
        </>
      )}

      <span className="flex-1" />

      {activeTab && (
        <span className="rounded bg-shell-active px-1.5 py-0.5 text-[10px] text-gray-400">
          YAML
        </span>
      )}
      <span className="text-gray-500">UTF-8</span>
    </footer>
  );
}
