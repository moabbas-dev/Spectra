import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Save,
  X,
  Eye,
  FileText,
  Code2,
  History,
  PanelLeft,
  PanelBottom,
  Settings,
  FilePlus,
  FolderPlus,
  FileUp,
  Download,
  Palette,
  BookOpen,
  BookTemplate,
} from 'lucide-react';
import { useUiStore } from '../../stores/ui.store';
import { useEditorStore } from '../../stores/editor.store';
import { useIPC } from '../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: typeof Save;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const ipc = useIPC();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const close = useCallback(() => useUiStore.getState().setCommandPaletteOpen(false), []);

  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const activeTabId = useEditorStore.getState().activeTabId;
    const hasActiveTab = !!activeTabId;

    return [
      /* File operations */
      {
        id: 'save',
        label: 'Save File',
        shortcut: 'Ctrl+S',
        icon: Save,
        category: 'File',
        action: () => {
          const { tabs, activeTabId: atId, markTabSaved } = useEditorStore.getState();
          const tab = tabs.find((t) => t.specFileId === atId);
          if (tab?.dirty) {
            void ipc(IPC.FS_WRITE_FILE, { path: tab.filePath, content: tab.content }).then(() =>
              markTabSaved(tab.specFileId, tab.content),
            );
          }
        },
      },
      {
        id: 'close-tab',
        label: 'Close Active Tab',
        shortcut: 'Ctrl+W',
        icon: X,
        category: 'File',
        action: () => {
          const { activeTabId: atId, closeTab } = useEditorStore.getState();
          if (atId) closeTab(atId);
        },
      },
      {
        id: 'close-all',
        label: 'Close All Tabs',
        icon: X,
        category: 'File',
        action: () => useEditorStore.getState().closeAllTabs(),
      },

      /* View switching */
      {
        id: 'view-form',
        label: 'Switch to Form View',
        icon: FileText,
        category: 'View',
        action: () => {
          const atId = useEditorStore.getState().activeTabId;
          if (atId) useEditorStore.getState().setActiveView(atId, 'form');
        },
      },
      {
        id: 'view-code',
        label: 'Switch to Code View',
        icon: Code2,
        category: 'View',
        action: () => {
          const atId = useEditorStore.getState().activeTabId;
          if (atId) useEditorStore.getState().setActiveView(atId, 'code');
        },
      },
      {
        id: 'view-preview',
        label: 'Switch to Preview',
        icon: Eye,
        category: 'View',
        action: () => {
          const atId = useEditorStore.getState().activeTabId;
          if (atId) useEditorStore.getState().setActiveView(atId, 'preview');
        },
      },
      {
        id: 'view-history',
        label: 'Switch to History',
        icon: History,
        category: 'View',
        action: () => {
          const atId = useEditorStore.getState().activeTabId;
          if (atId) useEditorStore.getState().setActiveView(atId, 'history');
        },
      },

      /* Layout */
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar',
        shortcut: 'Ctrl+B',
        icon: PanelLeft,
        category: 'Layout',
        action: () => {
          const ui = useUiStore.getState();
          ui.setSidebarVisible(!ui.sidebarVisible);
        },
      },
      {
        id: 'toggle-panel',
        label: 'Toggle Bottom Panel',
        shortcut: 'Ctrl+J',
        icon: PanelBottom,
        category: 'Layout',
        action: () => {
          const ui = useUiStore.getState();
          ui.setBottomPanelVisible(!ui.bottomPanelVisible);
        },
      },
      {
        id: 'focus-explorer',
        label: 'Focus Explorer',
        shortcut: 'Ctrl+Shift+E',
        icon: FolderPlus,
        category: 'Layout',
        action: () => {
          useUiStore.getState().setSidebarVisible(true);
          useUiStore.getState().setSidebarPanel('explorer');
        },
      },

      /* Versioning */
      {
        id: 'create-version',
        label: 'Create Version Snapshot',
        icon: BookOpen,
        category: 'Version',
        action: () => {
          const atId = useEditorStore.getState().activeTabId;
          if (atId) {
            void ipc(IPC.VERSION_CREATE, { specFileId: atId });
            // Switch to history view to show the new version
            useEditorStore.getState().setActiveView(atId, 'history');
          }
        },
      },

      /* Format */
      {
        id: 'format-yaml',
        label: 'Format YAML',
        icon: Palette,
        category: 'Editor',
        action: () => {
          const { tabs, activeTabId: atId, setTabContent } = useEditorStore.getState();
          const tab = tabs.find((t) => t.specFileId === atId);
          if (tab) {
            void ipc<string>(IPC.SPEC_FORMAT, tab.content).then((formatted) => {
              if (formatted) setTabContent(tab.specFileId, formatted);
            });
          }
        },
      },

      /* Import / Export */
      {
        id: 'import-file',
        label: 'Import File',
        icon: FileUp,
        category: 'File',
        action: () => {
          // Trigger import via toolbar — we'd need project context
          // For now, focus explorer where import is available
          useUiStore.getState().setSidebarVisible(true);
          useUiStore.getState().setSidebarPanel('explorer');
        },
      },
      {
        id: 'export-file',
        label: 'Export Active File',
        icon: Download,
        category: 'File',
        action: () => {
          // Export the active file — delegate to toolbar logic
          // For now, focus explorer for export access
          useUiStore.getState().setSidebarVisible(true);
          useUiStore.getState().setSidebarPanel('explorer');
        },
      },

      /* Quick Open */
      {
        id: 'quick-open',
        label: 'Quick Open File',
        shortcut: 'Ctrl+P',
        icon: Search,
        category: 'Navigation',
        action: () => useUiStore.getState().setQuickOpenOpen(true),
      },

      /* Settings */
      {
        id: 'settings',
        label: 'Open Settings',
        shortcut: 'Ctrl+,',
        icon: Settings,
        category: 'Preferences',
        action: () => useUiStore.getState().setSettingsOpen(true),
      },

      /* New file */
      {
        id: 'new-file',
        label: 'Create New File',
        icon: FilePlus,
        category: 'File',
        action: () => {
          useUiStore.getState().setSidebarVisible(true);
          useUiStore.getState().setSidebarPanel('explorer');
        },
      },

      /* Templates */
      {
        id: 'template-library',
        label: 'Browse Templates',
        icon: BookTemplate,
        category: 'Templates',
        action: () => useUiStore.getState().setTemplateLibraryOpen(true),
      },
    ].filter((cmd) => {
      // Disable some commands if no active tab
      if (!hasActiveTab && ['save', 'close-tab', 'view-form', 'view-code', 'view-preview', 'view-history', 'format-yaml', 'create-version', 'export-file'].includes(cmd.id)) {
        return false;
      }
      return true;
    });
  }, [ipc]);

  // Fuzzy filter
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.shortcut?.toLowerCase().includes(q) ?? false),
    );
  }, [query, commands]);

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIdx(0);
  }, [filtered.length]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-cmd-item]');
    items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIdx]) {
          close();
          filtered[selectedIdx].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-center pt-[15vh]" onClick={close}>
      <div
        className="h-fit w-[520px] overflow-hidden rounded-lg border border-shell-border bg-[#252526] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-shell-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
            aria-label="Command palette search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded p-0.5 text-gray-600 hover:text-gray-400"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-500 text-center">No commands match your search.</p>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={cmd.id}
                  data-cmd-item
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full items-center gap-3 px-3 py-1.5 text-left transition-colors ${
                    isSelected ? 'bg-blue-500/15 text-gray-100' : 'text-gray-300 hover:bg-shell-hover'
                  }`}
                  onClick={() => {
                    close();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="flex-1 text-sm truncate">{cmd.label}</span>
                  <span className="text-[10px] text-gray-600">{cmd.category}</span>
                  {cmd.shortcut && (
                    <kbd className="ml-1 rounded border border-shell-border bg-shell-bg px-1.5 py-0.5 text-[10px] text-gray-500 font-mono">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
