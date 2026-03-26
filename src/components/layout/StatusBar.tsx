import { useWorkspaceStore } from '../../stores/workspace.store';
import { useEditorStore } from '../../stores/editor.store';
import { useValidationStore } from '../../stores/validation.store';
import { Circle, AlertCircle, AlertTriangle } from 'lucide-react';

export function StatusBar() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.specFileId === activeTabId);

  const issues = useValidationStore((s) => s.issues);
  const isValidating = useValidationStore((s) => s.isValidating);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return (
    <footer
      className="flex h-6 shrink-0 items-center gap-4 border-t border-shell-border bg-blue-900/40 px-2 text-[11px] text-gray-300"
      role="status"
    >
      <span className="font-medium">Spectra</span>
      <span className="text-gray-500">|</span>
      <span>{active ? active.name : 'No workspace'}</span>

      {activeTab && (
        <>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-1">
            {activeTab.dirty && (
              <span title="Unsaved changes">
                <Circle className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              </span>
            )}
            {activeTab.title}
          </span>
        </>
      )}

      {/* Validation counts */}
      {activeTab && (errorCount > 0 || warningCount > 0) && (
        <>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-2">
            {errorCount > 0 && (
              <span className="flex items-center gap-0.5 text-red-400" title={`${errorCount} error(s)`}>
                <AlertCircle className="h-3 w-3" />
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-0.5 text-amber-400" title={`${warningCount} warning(s)`}>
                <AlertTriangle className="h-3 w-3" />
                {warningCount}
              </span>
            )}
          </span>
        </>
      )}

      {isValidating && (
        <>
          <span className="text-gray-500">|</span>
          <span className="text-[10px] text-gray-500 animate-pulse">Validating…</span>
        </>
      )}

      <span className="flex-1" />

      {activeTab && (
        <span className="rounded bg-shell-active px-1.5 py-0.5 text-[10px] text-gray-400">
          YAML
        </span>
      )}
      <span className="text-gray-500">UTF-8</span>
    </footer>
  );
}
