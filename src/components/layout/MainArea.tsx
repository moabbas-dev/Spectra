import { EditorContent } from '../editor/EditorContent';
import { EditorTabs } from '../editor/EditorTabs';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function MainArea() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  return (
    <main
      className="flex min-w-0 flex-1 flex-col bg-shell-bg"
      role="main"
    >
      <div className="shrink-0 border-b border-shell-border px-4 py-2 text-sm text-gray-400">
        {active ? active.name : 'No workspace selected'}
      </div>
      <EditorTabs />
      <div className="flex min-h-0 flex-1 flex-col">
        <EditorContent />
      </div>
    </main>
  );
}
