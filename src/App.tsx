import { useEffect } from 'react';
import { IPC } from '@shared/ipc-channels';
import type { ProjectRow, WorkspaceRow } from '@shared/ipc-payloads';
import { AppShell } from './components/layout/AppShell';
import { useIPC } from './hooks/useIPC';
import { useEditorStore } from './stores/editor.store';
import { useProjectsStore } from './stores/projects.store';
import { useUiStore } from './stores/ui.store';
import { useWorkspaceStore } from './stores/workspace.store';

export function App() {
  const ipc = useIPC();
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useWorkspaceStore(
    (s) => s.setActiveWorkspaceId,
  );
  const setProjects = useProjectsStore((s) => s.setProjects);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const list = await ipc<WorkspaceRow[]>(IPC.WORKSPACE_LIST);
        const active = await ipc<string | null>(IPC.WORKSPACE_GET_ACTIVE);
        if (cancelled) return;
        setWorkspaces(list);
        setActiveWorkspaceId(active);
        if (active) {
          const projs = await ipc<ProjectRow[]>(IPC.PROJECT_LIST, active);
          if (!cancelled) setProjects(projs);
        } else {
          setProjects([]);
        }
      } catch (e) {
        console.error('Spectra boot failed', e);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [ipc, setWorkspaces, setActiveWorkspaceId, setProjects]);

  useEffect(() => {
    async function saveActiveTab() {
      const { activeTabId, tabs, markTabSaved } = useEditorStore.getState();
      const tab = tabs.find((t) => t.specFileId === activeTabId);
      if (!tab) return;
      await ipc(IPC.FS_WRITE_FILE, {
        path: tab.filePath,
        content: tab.content,
      });
      markTabSaved(tab.specFileId, tab.content);
    }

    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const { sidebarVisible, setSidebarVisible } = useUiStore.getState();
        setSidebarVisible(!sidebarVisible);
      }
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        const { bottomPanelVisible, setBottomPanelVisible } =
          useUiStore.getState();
        setBottomPanelVisible(!bottomPanelVisible);
      }
      if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        useUiStore.getState().setQuickOpenOpen(true);
      }
      if (mod && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        const { activeTabId, closeTab } = useEditorStore.getState();
        if (activeTabId) closeTab(activeTabId);
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveActiveTab();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ipc]);

  return <AppShell />;
}
