import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editor.store';
import { useIPC } from './useIPC';
import { IPC } from '@shared/ipc-channels';

/**
 * Autosave hook — periodically saves dirty tabs to disk.
 * Mount once in AppShell.
 */
export function useAutosave() {
  const ipc = useIPC();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Default 30s interval; reads from settings could be added later
    const INTERVAL_MS = 30_000;

    intervalRef.current = setInterval(() => {
      const { tabs, markTabSaved } = useEditorStore.getState();
      const dirtyTabs = tabs.filter((t) => t.dirty);

      for (const tab of dirtyTabs) {
        void ipc(IPC.FS_WRITE_FILE, { path: tab.filePath, content: tab.content })
          .then(() => markTabSaved(tab.specFileId, tab.content))
          .catch((err) => console.error(`Autosave failed for ${tab.title}:`, err));
      }
    }, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ipc]);
}
