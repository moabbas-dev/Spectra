import { useCallback, useState } from 'react';
import { useEditorStore } from '../../../stores/editor.store';
import { useValidationStore, type ValidationIssue } from '../../../stores/validation.store';
import { useIPC } from '../../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  Code2,
} from 'lucide-react';

interface Props {
  specFileId: string;
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Errors',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Warnings',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    label: 'Info',
  },
} as const;

/**
 * Validation results view for the active spec file.
 * Runs Spectral validation via IPC and displays grouped results.
 */
export function ValidateView({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const setActiveView = useEditorStore((s) => s.setActiveView);
  const tab = tabs.find((t) => t.specFileId === specFileId);
  const issues = useValidationStore((s) => s.issues);
  const isValidating = useValidationStore((s) => s.isValidating);
  const setIssues = useValidationStore((s) => s.setIssues);
  const setIsValidating = useValidationStore((s) => s.setIsValidating);
  const ipc = useIPC();
  const [lastRan, setLastRan] = useState<Date | null>(null);

  const runValidation = useCallback(async () => {
    if (!tab) return;
    setIsValidating(true);
    try {
      const result = await ipc<ValidationIssue[]>(
        IPC.VALIDATE_SPEC,
        tab.content,
      );
      setIssues(result);
      setLastRan(new Date());
    } catch (err) {
      setIssues([
        {
          severity: 'error',
          code: 'validation-failed',
          message: err instanceof Error ? err.message : 'Validation failed',
        },
      ]);
    } finally {
      setIsValidating(false);
    }
  }, [tab, ipc, setIssues, setIsValidating]);

  if (!tab) return null;

  // Group issues by severity
  const grouped = {
    error: issues.filter((i) => i.severity === 'error'),
    warning: issues.filter((i) => i.severity === 'warning'),
    info: issues.filter((i) => i.severity === 'info'),
  };

  const total = issues.length;
  const hasRun = lastRan !== null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-shell-border px-4 py-3">
        <button
          type="button"
          disabled={isValidating}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          onClick={runValidation}
        >
          <RefreshCw
            className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`}
          />
          {isValidating ? 'Validating…' : 'Run Validation'}
        </button>

        {hasRun && !isValidating && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="h-3 w-3" />
              {grouped.error.length}
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {grouped.warning.length}
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <Info className="h-3 w-3" />
              {grouped.info.length}
            </span>
            <span className="text-[10px] text-gray-600">
              Last run: {lastRan.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!hasRun && (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <CheckCircle className="h-10 w-10 text-gray-700" />
            <p className="text-sm text-gray-400">No validation run yet</p>
            <p className="text-xs text-gray-600">
              Click "Run Validation" to check this spec against OpenAPI rules.
            </p>
          </div>
        )}

        {hasRun && total === 0 && !isValidating && (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium text-green-400">
              No issues found
            </p>
            <p className="text-xs text-gray-500">
              This spec passes all validation rules.
            </p>
          </div>
        )}

        {hasRun &&
          total > 0 &&
          (['error', 'warning', 'info'] as const).map((severity) => {
            const items = grouped[severity];
            if (items.length === 0) return null;
            const config = SEVERITY_CONFIG[severity];
            const Icon = config.icon;

            return (
              <div key={severity} className="border-b border-shell-border">
                <div
                  className={`flex items-center gap-2 px-4 py-2 ${config.bg}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  <span className={`text-xs font-semibold ${config.color}`}>
                    {config.label} ({items.length})
                  </span>
                </div>
                <div className="divide-y divide-shell-border">
                  {items.map((issue, i) => (
                    <button
                      key={`${severity}-${i}`}
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#2a2a2a]"
                      onClick={() => {
                        if (issue.line) {
                          setActiveView(specFileId, 'code');
                          // TODO: navigate to line in code editor
                        }
                      }}
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase ${config.bg} ${config.color} ${config.border} border`}
                      >
                        {issue.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300">
                          {issue.message}
                        </p>
                        {issue.line && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-600">
                            <Code2 className="h-2.5 w-2.5" />
                            Line {issue.line}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
