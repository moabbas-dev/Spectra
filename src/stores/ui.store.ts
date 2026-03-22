import { create } from 'zustand';

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'history' | 'favorites';

interface UiState {
  sidebarVisible: boolean;
  bottomPanelVisible: boolean;
  sidebarPanel: SidebarPanel;
  bottomPanelHeight: number;
  quickOpenOpen: boolean;
  setSidebarVisible: (v: boolean) => void;
  setBottomPanelVisible: (v: boolean) => void;
  setSidebarPanel: (p: SidebarPanel) => void;
  setBottomPanelHeight: (px: number) => void;
  setQuickOpenOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,
  bottomPanelVisible: true,
  sidebarPanel: 'explorer',
  bottomPanelHeight: 140,
  quickOpenOpen: false,
  setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
  setBottomPanelVisible: (bottomPanelVisible) => set({ bottomPanelVisible }),
  setSidebarPanel: (sidebarPanel) => set({ sidebarPanel }),
  setBottomPanelHeight: (bottomPanelHeight) => set({ bottomPanelHeight }),
  setQuickOpenOpen: (quickOpenOpen) => set({ quickOpenOpen }),
}));
