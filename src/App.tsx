import { useEffect, useRef } from 'react';
import { IPC } from '@shared/ipc-channels';
import type { ProjectRow, WorkspaceRow } from '@shared/ipc-payloads';
import { AppShell } from './components/layout/AppShell';
import { useIPC } from './hooks/useIPC';
import { useEditorStore } from './stores/editor.store';
import { useProjectsStore } from './stores/projects.store';
import { useUiStore } from './stores/ui.store';
import { useWorkspaceStore } from './stores/workspace.store';

const TABS_SETTINGS_KEY = 'editor.openTabs';

/** Minimal shape persisted per tab (no heavy content blob). */
interface PersistedTab {
  specFileId: string;
  filePath: string;
  title: string;
}

export function App() {
  const ipc = useIPC();
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setActiveWorkspaceId = useWorkspaceStore(
    (s) => s.setActiveWorkspaceId,
  );
  const setProjects = useProjectsStore((s) => s.setProjects);
  const didRestoreTabs = useRef(false);

  /* ── Boot: load workspaces, projects, and persisted tabs ── */
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

        /* Restore persisted tabs */
        if (!didRestoreTabs.current) {
          didRestoreTabs.current = true;
          const raw = await ipc<string | null>(IPC.SETTINGS_GET, TABS_SETTINGS_KEY);
          if (raw && !cancelled) {
            try {
              const saved = JSON.parse(raw) as {
                tabs: PersistedTab[];
                activeTabId: string | null;
              };
              const { openOrFocusTab, setActiveTab } =
                useEditorStore.getState();
              for (const pt of saved.tabs) {
                try {
                  const { content } = await ipc<{ content: string }>(
                    IPC.FS_READ_FILE,
                    pt.filePath,
                  );
                  openOrFocusTab({
                    specFileId: pt.specFileId,
                    filePath: pt.filePath,
                    title: pt.title,
                    content,
                    dirty: false,
                  });
                } catch {
                  /* file may have been deleted on disk — skip */
                }
              }
              if (saved.activeTabId) {
                setActiveTab(saved.activeTabId);
              }
            } catch {
              /* corrupt JSON — ignore */
            }
          }
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

  /* ── Persist tabs whenever they change ── */
  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prev) => {
      if (state.tabs === prev.tabs && state.activeTabId === prev.activeTabId) {
        return;
      }
      const payload: { tabs: PersistedTab[]; activeTabId: string | null } = {
        tabs: state.tabs.map((t) => ({
          specFileId: t.specFileId,
          filePath: t.filePath,
          title: t.title,
        })),
        activeTabId: state.activeTabId,
      };
      void ipc(
        IPC.SETTINGS_SET,
        TABS_SETTINGS_KEY,
        JSON.stringify(payload),
      );
    });
    return unsub;
  }, [ipc]);

  /* ── Global keyboard shortcuts ── */
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
