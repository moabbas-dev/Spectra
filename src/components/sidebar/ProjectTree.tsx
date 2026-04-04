import { useState, type FormEvent } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { IPC } from '@shared/ipc-channels';
import type { ProjectRow } from '@shared/ipc-payloads';
import { useIPC } from '../../hooks/useIPC';
import { useProjectsStore } from '../../stores/projects.store';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { ExplorerTree } from './ExplorerTree';

export function ProjectTree() {
  const ipc = useIPC();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const projects = useProjectsStore((s) => s.projects);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const bumpTree = useProjectsStore((s) => s.bumpTree);

  /* Track which projects are expanded (all expanded by default) */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleProject = (id: string) => {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  };

  async function handleAddProject(e: FormEvent) {
    e.preventDefault();
    if (!activeWorkspaceId) {
      setError('Select a workspace first.');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Project name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ipc<ProjectRow>(IPC.PROJECT_CREATE, {
        workspaceId: activeWorkspaceId,
        name: trimmed,
      });
      const list = await ipc<ProjectRow[]>(
        IPC.PROJECT_LIST,
        activeWorkspaceId,
      );
      setProjects(list);
      setName('');
      setShowAddForm(false);
      bumpTree();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!activeWorkspaceId) {
    return (
      <p className="p-2 text-xs text-gray-500">
        Select a workspace to manage projects.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {projects.length === 0 && !showAddForm && (
        <p className="px-3 py-2 text-xs text-gray-500">No projects yet.</p>
      )}

      {/* Each project is a VS Code-style collapsible section */}
      {projects.map((p) => {
        const isCollapsed = collapsed[p.id] ?? false;
        return (
          <div key={p.id}>
            {/* Section header — sticky, bold, uppercase like VS Code */}
            <button
              type="button"
              className="group flex w-full items-center gap-1 bg-shell-sidebar px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-200 transition-colors sticky top-0 z-[5] border-b border-shell-border/50"
              onClick={() => toggleProject(p.id)}
              title={p.description ?? p.name}
            >
              <span className="shrink-0 text-gray-500">
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="truncate">{p.name}</span>
            </button>

            {/* Project contents */}
            {!isCollapsed && (
              <ExplorerTree projectId={p.id} />
            )}
          </div>
        );
      })}

      {/* Inline add project form */}
      {showAddForm && (
        <form onSubmit={handleAddProject} className="px-2 py-1.5 space-y-1 border-t border-shell-border/50">
          <input
            className="w-full rounded border border-shell-border bg-shell-bg px-1.5 py-0.5 text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            aria-label="New project name"
            autoFocus
          />
          <div className="flex gap-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-shell-hover hover:text-gray-200"
              onClick={() => { setShowAddForm(false); setError(null); }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-[10px] text-red-400" role="alert">{error}</p>
          )}
        </form>
      )}

      {/* Small + button to add project (when form is hidden) */}
      {!showAddForm && (
        <button
          type="button"
          className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors border-t border-shell-border/30"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-3 w-3" />
          <span>New project</span>
        </button>
      )}
    </div>
  );
}
