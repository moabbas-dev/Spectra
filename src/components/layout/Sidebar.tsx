import { WorkspaceSelector } from '../sidebar/WorkspaceSelector';
import { ProjectTree } from '../sidebar/ProjectTree';
import { useUiStore } from '../../stores/ui.store';

export function Sidebar() {
  const panel = useUiStore((s) => s.sidebarPanel);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-shell-border bg-shell-sidebar"
      style={{ width: sidebarWidth }}
      aria-label="Side bar"
    >
      <div className="border-b border-shell-border px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {panel === 'explorer' && 'Explorer'}
        {panel === 'search' && 'Search'}
        {panel === 'git' && 'Source Control'}
        {panel === 'history' && 'History'}
        {panel === 'favorites' && 'Favorites'}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {panel === 'explorer' ? (
          <>
            <WorkspaceSelector />
            <ProjectTree />
          </>
        ) : (
          <div className="p-3 text-sm text-gray-500">
            This panel is not implemented yet.
          </div>
        )}
      </div>
    </aside>
  );
}
