import { create } from 'zustand';

export type EditorView = 'form' | 'code' | 'preview' | 'history' | 'validate';

export interface EditorTab {
  specFileId: string;
  filePath: string;
  title: string;
  content: string;
  dirty: boolean;
  activeView: EditorView;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  openOrFocusTab: (tab: Omit<EditorTab, 'dirty' | 'activeView'> & { dirty?: boolean; activeView?: EditorView }) => void;
  closeTab: (specFileId: string) => void;
  closeOtherTabs: (specFileId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (specFileId: string | null) => void;
  setTabContent: (specFileId: string, content: string) => void;
  setActiveView: (specFileId: string, view: EditorView) => void;
  markTabSaved: (specFileId: string, content: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openOrFocusTab: (tab) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.specFileId === tab.specFileId);
    if (existing) {
      set({
        activeTabId: tab.specFileId,
        tabs: tabs.map((t) =>
          t.specFileId === tab.specFileId
            ? {
                ...t,
                content: tab.content,
                dirty: tab.dirty ?? t.dirty,
              }
            : t,
        ),
      });
      return;
    }
    const next: EditorTab = {
      specFileId: tab.specFileId,
      filePath: tab.filePath,
      title: tab.title,
      content: tab.content,
      dirty: tab.dirty ?? false,
      activeView: 'code',
    };
    set({ tabs: [...tabs, next], activeTabId: tab.specFileId });
  },

  closeTab: (specFileId) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.specFileId === specFileId);
    if (idx < 0) return;
    const nextTabs = tabs.filter((t) => t.specFileId !== specFileId);
    let nextActive = activeTabId;
    if (activeTabId === specFileId) {
      nextActive =
        nextTabs[idx - 1]?.specFileId ?? nextTabs[idx]?.specFileId ?? null;
    }
    set({ tabs: nextTabs, activeTabId: nextActive });
  },

  closeOtherTabs: (specFileId) => {
    const { tabs } = get();
    const keep = tabs.filter((t) => t.specFileId === specFileId);
    set({ tabs: keep, activeTabId: specFileId });
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  setActiveTab: (specFileId) => set({ activeTabId: specFileId }),

  setTabContent: (specFileId, content) => {
    set({
      tabs: get().tabs.map((t) =>
        t.specFileId === specFileId
          ? { ...t, content, dirty: true }
          : t,
      ),
    });
  },

  setActiveView: (specFileId, view) => {
    set({
      tabs: get().tabs.map((t) =>
        t.specFileId === specFileId ? { ...t, activeView: view } : t,
      ),
    });
  },

  markTabSaved: (specFileId, content) => {
    set({
      tabs: get().tabs.map((t) =>
        t.specFileId === specFileId
          ? { ...t, content, dirty: false }
          : t,
      ),
    });
  },
}));
