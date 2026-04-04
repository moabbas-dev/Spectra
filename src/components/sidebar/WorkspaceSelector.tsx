import { useCallback, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
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

  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
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

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="border-b border-shell-border px-2 py-1.5">
      {/* Compact row: dropdown + add button */}
      <div className="flex items-center gap-1">
        <select
          className="min-w-0 flex-1 rounded border border-shell-border bg-shell-bg px-1.5 py-0.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
          value={activeWorkspaceId ?? ''}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v) void selectWorkspace(v);
          }}
          aria-label="Active workspace"
          title={activeWorkspace ? `${activeWorkspace.name} — ${activeWorkspace.rootPath}` : 'Select workspace'}
        >
          <option value="">Select workspace…</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors"
          onClick={() => setShowForm((v) => !v)}
          title={showForm ? 'Cancel' : 'Add workspace'}
          aria-label={showForm ? 'Cancel' : 'Add workspace'}
        >
          {showForm ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
        {activeWorkspaceId && (
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-gray-500 hover:text-red-400 transition-colors"
            onClick={() => void handleDelete(activeWorkspaceId)}
            disabled={busy}
            title="Delete active workspace"
            aria-label="Delete active workspace"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Expandable create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mt-1.5 space-y-1">
          <input
            className="w-full rounded border border-shell-border bg-shell-bg px-1.5 py-0.5 text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            aria-label="New workspace name"
            autoFocus
          />
          <input
            className="w-full rounded border border-shell-border bg-shell-bg px-1.5 py-0.5 text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Folder path (absolute)"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            disabled={busy}
            aria-label="Workspace root folder path"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Create
          </button>
          {error && (
            <p className="text-[10px] text-red-400" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
