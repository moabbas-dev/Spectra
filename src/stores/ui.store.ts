import { create } from 'zustand';

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'history' | 'favorites';

interface UiState {
  sidebarVisible: boolean;
  bottomPanelVisible: boolean;
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;
  bottomPanelHeight: number;
  quickOpenOpen: boolean;
  setSidebarVisible: (v: boolean) => void;
  setBottomPanelVisible: (v: boolean) => void;
  setSidebarPanel: (p: SidebarPanel) => void;
  setSidebarWidth: (px: number) => void;
  setBottomPanelHeight: (px: number) => void;
  setQuickOpenOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarVisible: true,
  bottomPanelVisible: true,
  sidebarPanel: 'explorer',
  sidebarWidth: 260,
  bottomPanelHeight: 160,
  quickOpenOpen: false,
  setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
  setBottomPanelVisible: (bottomPanelVisible) => set({ bottomPanelVisible }),
  setSidebarPanel: (sidebarPanel) => set({ sidebarPanel }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth: Math.max(180, Math.min(500, sidebarWidth)) }),
  setBottomPanelHeight: (bottomPanelHeight) => set({ bottomPanelHeight: Math.max(80, Math.min(500, bottomPanelHeight)) }),
  setQuickOpenOpen: (quickOpenOpen) => set({ quickOpenOpen }),
}));
