import { QuickOpenModal } from '../dialogs/QuickOpenModal';
import { ActivityBar } from './ActivityBar';
import { BottomPanel } from './BottomPanel';
import { MainArea } from './MainArea';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { useUiStore } from '../../stores/ui.store';

export function AppShell() {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible);
  const bottomPanelVisible = useUiStore((s) => s.bottomPanelVisible);
  const bottomPanelHeight = useUiStore((s) => s.bottomPanelHeight);

  return (
    <div className="flex h-full min-h-0 flex-col bg-shell-bg">
      <div className="flex min-h-0 flex-1 flex-row">
        <ActivityBar />
        {sidebarVisible ? <Sidebar /> : null}
        <MainArea />
      </div>
      {bottomPanelVisible ? (
        <div
          className="shrink-0 border-t border-shell-border bg-shell-sidebar"
          style={{ height: bottomPanelHeight }}
        >
          <BottomPanel />
        </div>
      ) : null}
      <StatusBar />
      <QuickOpenModal />
    </div>
  );
}
