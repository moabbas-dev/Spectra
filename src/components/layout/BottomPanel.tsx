import { useValidationStore } from '../../stores/validation.store';
import { useEditorStore } from '../../stores/editor.store';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

type Tab = 'problems' | 'output';

export function BottomPanel() {
  const [tab, setTab] = useState<Tab>('problems');
  const issues = useValidationStore((s) => s.issues);
  const isValidating = useValidationStore((s) => s.isValidating);
  const setActiveView = useEditorStore((s) => s.setActiveView);
  const activeTabId = useEditorStore((s) => s.activeTabId);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex shrink-0 items-center gap-1 border-b border-shell-border px-2 text-xs"
        role="tablist"
        aria-label="Bottom panel"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'problems'}
          onClick={() => setTab('problems')}
          className={`flex items-center gap-1.5 rounded-t px-2 py-1 ${
            tab === 'problems'
              ? 'bg-shell-bg text-gray-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Problems
          {issues.length > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              {errors.length > 0 && (
                <span className="flex items-center gap-0.5 text-red-400">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.length}
                </span>
              )}
              {warnings.length > 0 && (
                <span className="flex items-center gap-0.5 text-amber-400">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {warnings.length}
                </span>
              )}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'output'}
          onClick={() => setTab('output')}
          className={`rounded-t px-2 py-1 ${
            tab === 'output'
              ? 'bg-shell-bg text-gray-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Output
        </button>

        {isValidating && (
          <span className="ml-auto text-[10px] text-gray-600 animate-pulse">
            Validating…
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto font-mono text-xs text-gray-400">
        {tab === 'problems' ? (
          issues.length === 0 ? (
            <p className="p-2">
              No validation issues yet. Open a spec to run Spectral.
            </p>
          ) : (
            <div className="divide-y divide-shell-border">
              {issues.map((issue, i) => {
                const Icon =
                  issue.severity === 'error'
                    ? AlertCircle
                    : issue.severity === 'warning'
                      ? AlertTriangle
                      : Info;
                const color =
                  issue.severity === 'error'
                    ? 'text-red-400'
                    : issue.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-blue-400';

                return (
                  <button
                    key={`${issue.code}-${i}`}
                    type="button"
                    className="flex w-full items-start gap-2 px-2 py-1.5 text-left transition-colors hover:bg-[#2a2a2a]"
                    onClick={() => {
                      if (activeTabId) {
                        setActiveView(activeTabId, 'code');
                      }
                    }}
                  >
                    <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${color}`} />
                    <span className="flex-1 min-w-0 text-gray-300">
                      {issue.message}
                    </span>
                    {issue.line && (
                      <span className="shrink-0 text-[10px] text-gray-600">
                        Ln {issue.line}
                      </span>
                    )}
                    <span className="shrink-0 rounded bg-[#2d2d2d] px-1 py-0.5 text-[9px] text-gray-500">
                      {issue.code}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <p className="p-2">Spectra output — Git and build logs will appear here.</p>
        )}
      </div>
    </div>
  );
}
