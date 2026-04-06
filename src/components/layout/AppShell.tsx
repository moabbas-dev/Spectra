import { useCallback, useRef } from 'react';
import { PanelBottomClose, PanelBottomOpen } from 'lucide-react';
import { QuickOpenModal } from '../dialogs/QuickOpenModal';
import { CommandPalette } from '../dialogs/CommandPalette';
import { SettingsDialog } from '../dialogs/SettingsDialog';
import { TemplateLibrary } from '../templates/TemplateLibrary';
import { ActivityBar } from './ActivityBar';
import { BottomPanel } from './BottomPanel';
import { MainArea } from './MainArea';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { useUiStore } from '../../stores/ui.store';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutosave } from '../../hooks/useAutosave';

export function AppShell() {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible);
  const bottomPanelVisible = useUiStore((s) => s.bottomPanelVisible);
  const bottomPanelHeight = useUiStore((s) => s.bottomPanelHeight);
  const setBottomPanelHeight = useUiStore((s) => s.setBottomPanelHeight);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const setBottomPanelVisible = useUiStore((s) => s.setBottomPanelVisible);

  /* Mount global hooks */
  useKeyboardShortcuts();
  useAutosave();

  /* ── Sidebar drag-to-resize ── */
  const sidebarDragging = useRef(false);

  const onSidebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      sidebarDragging.current = true;
      const startX = e.clientX;
      const startW = useUiStore.getState().sidebarWidth;

      const onMove = (ev: MouseEvent) => {
        if (!sidebarDragging.current) return;
        const delta = ev.clientX - startX;
        setSidebarWidth(startW + delta);
      };

      const onUp = () => {
        sidebarDragging.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setSidebarWidth],
  );

  /* ── Bottom panel drag-to-resize ── */
  const bottomDragging = useRef(false);

  const onBottomMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      bottomDragging.current = true;
      const startY = e.clientY;
      const startH = useUiStore.getState().bottomPanelHeight;

      const onMove = (ev: MouseEvent) => {
        if (!bottomDragging.current) return;
        const delta = startY - ev.clientY;
        setBottomPanelHeight(startH + delta);
      };

      const onUp = () => {
        bottomDragging.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [setBottomPanelHeight],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-shell-bg">
      {/* Main content row — min-h prevents bottom panel from squishing sidebar/editor */}
      <div className="flex min-h-[200px] flex-1 flex-row overflow-hidden">
        <ActivityBar />

        {sidebarVisible && (
          <>
            <Sidebar />
            {/* Sidebar resize handle */}
            <div
              className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
              onMouseDown={onSidebarMouseDown}
              title="Drag to resize sidebar"
            >
              <div className="absolute inset-y-0 -left-0.5 -right-0.5" />
            </div>
          </>
        )}

        <MainArea />
      </div>

      {/* Bottom panel with resize handle */}
      {bottomPanelVisible && (
        <div
          className="relative shrink-0 border-t border-shell-border bg-shell-sidebar"
          style={{ height: bottomPanelHeight, maxHeight: '60vh' }}
        >
          {/* Top resize handle */}
          <div
            className="absolute inset-x-0 -top-1 z-10 h-2 cursor-row-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
            onMouseDown={onBottomMouseDown}
            title="Drag to resize panel"
          />

          {/* Toggle button (top-right) */}
          <button
            type="button"
            className="absolute right-2 top-0.5 z-10 rounded p-0.5 text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors"
            onClick={() => setBottomPanelVisible(false)}
            title="Hide panel"
          >
            <PanelBottomClose className="h-3.5 w-3.5" />
          </button>

          <BottomPanel />
        </div>
      )}

      {/* Show bottom panel button when hidden — right-aligned */}
      {!bottomPanelVisible && (
        <div className="flex h-6 shrink-0 items-center justify-end border-t border-shell-border bg-shell-sidebar px-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors"
            onClick={() => setBottomPanelVisible(true)}
            title="Show panel"
          >
            <PanelBottomOpen className="h-3 w-3" />
            Panel
          </button>
        </div>
      )}

      <StatusBar />
      <QuickOpenModal />
      <CommandPalette />
      <SettingsDialog />
      <TemplateLibrary />
    </div>
  );
}

