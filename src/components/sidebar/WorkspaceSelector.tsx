import { useCallback, useState, type FormEvent } from 'react';
import { IPC } from '@shared/ipc-channels';
import type { ProjectRow, WorkspaceRow } from '@shared/ipc-payloads';
import { useIPC } from '../../hooks/useIPC';
import { useProjectsStore } from '../../stores/projects.store';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function WorkspaceSelector() {
  const ipc = useIPC();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useWorkspaceStore(
    (s) => s.setActiveWorkspaceId,
  );
  const setProjects = useProjectsStore((s) => s.setProjects);
  const setSelectedProjectId = useProjectsStore(
    (s) => s.setSelectedProjectId,
  );

  const [name, setName] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    const list = await ipc<WorkspaceRow[]>(IPC.WORKSPACE_LIST);
    setWorkspaces(list);
  }, [ipc, setWorkspaces]);

  const loadProjectsForWorkspace = useCallback(
    async (workspaceId: string) => {
      const projects = await ipc<ProjectRow[]>(IPC.PROJECT_LIST, workspaceId);
      setProjects(projects);
    },
    [ipc, setProjects],
  );

  const selectWorkspace = useCallback(
    async (id: string) => {
      await ipc(IPC.WORKSPACE_SET_ACTIVE, id);
      setActiveWorkspaceId(id);
      setSelectedProjectId(null);
      await loadProjectsForWorkspace(id);
    },
    [ipc, setActiveWorkspaceId, setSelectedProjectId, loadProjectsForWorkspace],
  );

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedPath = rootPath.trim();
    if (!trimmedName || !trimmedPath) {
      setError('Name and folder path are required.');
      return;
    }
    setBusy(true);
    try {
      const created = await ipc<WorkspaceRow>(IPC.WORKSPACE_CREATE, {
        name: trimmedName,
        rootPath: trimmedPath,
      });
      await refreshWorkspaces();
      await selectWorkspace(created.id);
      setName('');
      setRootPath('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        'Delete this workspace from Spectra? Files on disk are not removed.',
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ipc(IPC.WORKSPACE_DELETE, id);
      await refreshWorkspaces();
      const nextActive = await ipc<string | null>(IPC.WORKSPACE_GET_ACTIVE);
      setActiveWorkspaceId(nextActive);
      setSelectedProjectId(null);
      if (nextActive) {
        await loadProjectsForWorkspace(nextActive);
      } else {
        setProjects([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-shell-border p-2">
      <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
        Workspace
      </label>
      <select
        className="mb-2 w-full rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200"
        value={activeWorkspaceId ?? ''}
        onChange={(ev) => {
          const v = ev.target.value;
          if (v) void selectWorkspace(v);
        }}
        aria-label="Active workspace"
      >
        <option value="">Select…</option>
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <form onSubmit={handleCreate} className="space-y-1">
        <input
          className="w-full rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs"
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          aria-label="New workspace name"
        />
        <input
          className="w-full rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs"
          placeholder="Folder path (absolute)"
          value={rootPath}
          onChange={(e) => setRootPath(e.target.value)}
          disabled={busy}
          aria-label="Workspace root folder path"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Add workspace
        </button>
      </form>
      {error ? (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {workspaces.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-xs">
          {workspaces.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between gap-1 text-gray-400"
            >
              <span className="truncate" title={w.rootPath}>
                {w.name}
              </span>
              <button
                type="button"
                className="shrink-0 text-gray-500 hover:text-red-400"
                onClick={() => void handleDelete(w.id)}
                disabled={busy}
                aria-label={`Delete workspace ${w.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
