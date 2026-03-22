import { useState, type FormEvent } from 'react';
import { Briefcase } from 'lucide-react';
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
  const selectedProjectId = useProjectsStore((s) => s.selectedProjectId);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const setSelectedProjectId = useProjectsStore(
    (s) => s.setSelectedProjectId,
  );
  const bumpTree = useProjectsStore((s) => s.bumpTree);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const created = await ipc<ProjectRow>(IPC.PROJECT_CREATE, {
        workspaceId: activeWorkspaceId,
        name: trimmed,
      });
      const list = await ipc<ProjectRow[]>(
        IPC.PROJECT_LIST,
        activeWorkspaceId,
      );
      setProjects(list);
      setSelectedProjectId(created.id);
      setName('');
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
    <div className="p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">
        Projects
      </div>
      <ul className="mb-2 space-y-0.5">
        {projects.length === 0 ? (
          <li className="text-xs text-gray-500">No projects yet.</li>
        ) : (
          projects.map((p) => {
            const selected = p.id === selectedProjectId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs ${
                    selected
                      ? 'bg-shell-active text-gray-100'
                      : 'text-gray-400 hover:bg-shell-hover hover:text-gray-200'
                  }`}
                  onClick={() => setSelectedProjectId(p.id)}
                  title={p.description ?? undefined}
                >
                  <Briefcase
                    className="h-3.5 w-3.5 shrink-0 opacity-80"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{p.name}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {selectedProjectId ? (
        <ExplorerTree projectId={selectedProjectId} />
      ) : null}

      <form onSubmit={handleAddProject} className="mt-2 space-y-1 border-t border-shell-border pt-2">
        <input
          className="w-full rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs"
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          aria-label="New project name"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded border border-shell-border bg-shell-active px-2 py-1 text-xs hover:bg-shell-hover disabled:opacity-50"
        >
          Add project
        </button>
      </form>
      {error ? (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
