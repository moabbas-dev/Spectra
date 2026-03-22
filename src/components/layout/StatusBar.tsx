import { useWorkspaceStore } from '../../stores/workspace.store';

export function StatusBar() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  return (
    <footer
      className="flex h-6 shrink-0 items-center gap-4 border-t border-shell-border bg-blue-900/40 px-2 text-[11px] text-gray-300"
      role="status"
    >
      <span className="font-medium">Spectra</span>
      <span className="text-gray-500">|</span>
      <span>{active ? active.name : 'No workspace'}</span>
      <span className="flex-1" />
      <span className="text-gray-500">UTF-8</span>
    </footer>
  );
}
