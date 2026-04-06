import { useEffect } from 'react';
import { useUiStore } from '../stores/ui.store';
import { useEditorStore } from '../stores/editor.store';
import { useIPC } from './useIPC';
import { IPC } from '@shared/ipc-channels';
import type { IpcChannel } from '@shared/ipc-channels';

/**
 * Global keyboard shortcut handler.
 * Mount once in AppShell — handles all app-wide shortcuts.
 */
export function useKeyboardShortcuts() {
  const ipc = useIPC();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();

      /* ── Ctrl+Shift combos ── */
      if (ctrl && shift) {
        switch (key) {
          case 'p': {
            // Command Palette
            e.preventDefault();
            useUiStore.getState().setCommandPaletteOpen(true);
            return;
          }
          case 'e': {
            // Focus Explorer
            e.preventDefault();
            useUiStore.getState().setSidebarVisible(true);
            useUiStore.getState().setSidebarPanel('explorer');
            return;
          }
          case 'f': {
            // Focus Search
            e.preventDefault();
            useUiStore.getState().setSidebarVisible(true);
            useUiStore.getState().setSidebarPanel('search');
            return;
          }
        }
        return;
      }

      /* ── Ctrl combos ── */
      if (ctrl) {
        switch (key) {
          case 's': {
            // Save active file
            e.preventDefault();
            void saveActiveFile(ipc);
            return;
          }
          case 'p': {
            // Quick Open
            e.preventDefault();
            useUiStore.getState().setQuickOpenOpen(true);
            return;
          }
          case 'w': {
            // Close active tab
            e.preventDefault();
            const { activeTabId, closeTab } = useEditorStore.getState();
            if (activeTabId) closeTab(activeTabId);
            return;
          }
          case 'b': {
            // Toggle sidebar
            e.preventDefault();
            const ui = useUiStore.getState();
            ui.setSidebarVisible(!ui.sidebarVisible);
            return;
          }
          case 'j': {
            // Toggle bottom panel
            e.preventDefault();
            const ui = useUiStore.getState();
            ui.setBottomPanelVisible(!ui.bottomPanelVisible);
            return;
          }
          case ',': {
            // Open Settings
            e.preventDefault();
            useUiStore.getState().setSettingsOpen(true);
            return;
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ipc]);
}

/** Save the active file to disk */
async function saveActiveFile(
  ipc: <T>(channel: IpcChannel, ...args: unknown[]) => Promise<T>,
) {
  const { tabs, activeTabId, markTabSaved } = useEditorStore.getState();
  const tab = tabs.find((t) => t.specFileId === activeTabId);
  if (!tab || !tab.dirty) return;

  try {
    await ipc(IPC.FS_WRITE_FILE, { path: tab.filePath, content: tab.content });
    markTabSaved(tab.specFileId, tab.content);
  } catch (err) {
    console.error('Save failed:', err);
  }
}
