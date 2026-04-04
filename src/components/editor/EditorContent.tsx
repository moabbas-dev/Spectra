import { useRef } from 'react';
import { useEditorStore, type EditorView } from '../../stores/editor.store';
import { EditorViewSwitcher } from './EditorViewSwitcher';
import { CodeEditorView } from './views/CodeEditorView';
import { FormEditorView } from './views/FormEditorView';
import { PreviewView } from './views/PreviewView';
import { HistoryView } from './views/HistoryView';

/**
 * All possible views. Each view is rendered once activated, then kept mounted
 * (hidden via display:none) so that heavy components like SwaggerUI and the
 * Form editor preserve their internal state across tab switches.
 */
const VIEW_KEYS: EditorView[] = ['form', 'code', 'preview', 'history'];

function ViewPanel({ view, specFileId }: { view: EditorView; specFileId: string }) {
  switch (view) {
    case 'form':
      return <FormEditorView specFileId={specFileId} />;
    case 'code':
      return <CodeEditorView specFileId={specFileId} />;
    case 'preview':
      return <PreviewView specFileId={specFileId} />;
    case 'history':
      return <HistoryView specFileId={specFileId} />;
    default:
      return <CodeEditorView specFileId={specFileId} />;
  }
}

export function EditorContent() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);

  const active = tabs.find((t) => t.specFileId === activeTabId);

  /**
   * Track which views have been activated at least once per spec file.
   * We use a ref so that we don't re-render when we add a view — the
   * current render cycle already shows it.
   */
  const mountedViewsRef = useRef<Record<string, Set<EditorView>>>({});

  if (!active) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
        Open a spec from the explorer or press Ctrl+P to quick open.
      </div>
    );
  }

  const currentView = active.activeView ?? 'code';
  const fileId = active.specFileId;

  // Ensure current view is tracked as mounted
  if (!mountedViewsRef.current[fileId]) {
    mountedViewsRef.current[fileId] = new Set();
  }
  mountedViewsRef.current[fileId].add(currentView);

  const mountedViews = mountedViewsRef.current[fileId];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorViewSwitcher specFileId={fileId} />

      {/*
       * Render all previously-activated views for this file simultaneously.
       * The active one gets display:flex, the rest get display:none.
       * This keeps SwaggerUI, Form, etc. mounted and avoids re-initialization.
       */}
      {VIEW_KEYS.map((viewKey) => {
        if (!mountedViews.has(viewKey)) return null;
        const isActive = viewKey === currentView;
        return (
          <div
            key={viewKey}
            className="min-h-0 flex-1 flex-col"
            style={{ display: isActive ? 'flex' : 'none' }}
          >
            <ViewPanel view={viewKey} specFileId={fileId} />
          </div>
        );
      })}
    </div>
  );
}
