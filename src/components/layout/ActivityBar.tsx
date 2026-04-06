import {
  Folder,
  GitBranch,
  History,
  Search,
  Settings,
  Star,
} from 'lucide-react';
import { useUiStore } from '../../stores/ui.store';

const panels = [
  { id: 'explorer' as const, label: 'Explorer', Icon: Folder },
  { id: 'search' as const, label: 'Search', Icon: Search },
  { id: 'git' as const, label: 'Source Control', Icon: GitBranch },
  { id: 'history' as const, label: 'History', Icon: History },
  { id: 'favorites' as const, label: 'Favorites', Icon: Star },
];

export function ActivityBar() {
  const sidebarPanel = useUiStore((s) => s.sidebarPanel);
  const setSidebarPanel = useUiStore((s) => s.setSidebarPanel);
  const sidebarVisible = useUiStore((s) => s.sidebarVisible);
  const setSidebarVisible = useUiStore((s) => s.setSidebarVisible);

  return (
    <nav
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-shell-border bg-shell-activity py-2"
      aria-label="Activity bar"
    >
      {panels.map((p) => {
        const active = sidebarVisible && sidebarPanel === p.id;
        const Icon = p.Icon;
        return (
          <button
            key={p.id}
            type="button"
            title={p.label}
            aria-label={p.label}
            aria-pressed={active}
            onClick={() => {
              if (sidebarVisible && sidebarPanel === p.id) {
                setSidebarVisible(false);
              } else {
                setSidebarVisible(true);
                setSidebarPanel(p.id);
              }
            }}
            className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
              active
                ? 'border-l-2 border-blue-500 bg-shell-active text-blue-400'
                : 'text-gray-400 hover:bg-shell-hover hover:text-gray-200'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
      <div className="flex-1" />
      <button
        type="button"
        title="Settings"
        aria-label="Settings"
        className="flex h-10 w-10 items-center justify-center rounded text-gray-400 hover:bg-shell-hover hover:text-gray-200"
        onClick={() => useUiStore.getState().setSettingsOpen(true)}
      >
        <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </nav>
  );
}
