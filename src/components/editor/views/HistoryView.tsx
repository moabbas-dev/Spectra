import { useCallback, useEffect, useState } from 'react';
import {
  History,
  Plus,
  RotateCcw,
  Trash2,
  GitCompareArrows,
  Clock,
  Tag,
  User,
  Hash,
  Loader2,
  Eye,
} from 'lucide-react';
import { IPC } from '@shared/ipc-channels';
import type { SpecVersionRow } from '@shared/ipc-payloads';
import { useIPC } from '../../../hooks/useIPC';
import { useEditorStore } from '../../../stores/editor.store';
import { CreateVersionModal } from '../../version/CreateVersionModal';
import { VersionDiffViewer } from '../../version/VersionDiffViewer';

interface Props {
  specFileId: string;
}

type DiffState = {
  oldVersion: SpecVersionRow;
  newVersion: SpecVersionRow;
} | null;

export function HistoryView({ specFileId }: Props) {
  const ipc = useIPC();
  const setTabContent = useEditorStore((s) => s.setTabContent);

  const [versions, setVersions] = useState<SpecVersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [diff, setDiff] = useState<DiffState>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<{ version: SpecVersionRow; content: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // versionId being acted upon

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ipc<SpecVersionRow[]>(IPC.VERSION_LIST, specFileId);
      setVersions(list);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  }, [ipc, specFileId]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  const handleRestore = useCallback(
    async (version: SpecVersionRow) => {
      if (!window.confirm(`Restore to version ${version.versionNumber}? A snapshot of the current state will be saved first.`))
        return;
      setBusy(version.id);
      try {
        const result = await ipc<{ restored: SpecVersionRow; content: string }>(
          IPC.VERSION_RESTORE,
          { versionId: version.id, specFileId },
        );
        // Update the editor tab content
        setTabContent(specFileId, result.content);
        await loadVersions();
      } catch (err) {
        console.error('Restore failed:', err);
      } finally {
        setBusy(null);
      }
    },
    [ipc, specFileId, setTabContent, loadVersions],
  );

  const handleDelete = useCallback(
    async (version: SpecVersionRow) => {
      if (!window.confirm(`Delete version ${version.versionNumber}${version.versionLabel ? ` (${version.versionLabel})` : ''}?`))
        return;
      setBusy(version.id);
      try {
        await ipc(IPC.VERSION_DELETE, version.id);
        await loadVersions();
      } catch (err) {
        console.error('Delete failed:', err);
      } finally {
        setBusy(null);
      }
    },
    [ipc, loadVersions],
  );

  const handleCompare = useCallback(
    (version: SpecVersionRow) => {
      if (!selectedForCompare) {
        setSelectedForCompare(version.id);
        return;
      }
      // Find both versions
      const first = versions.find((v) => v.id === selectedForCompare);
      const second = version;
      if (!first || first.id === second.id) {
        setSelectedForCompare(null);
        return;
      }
      // Older version on left, newer on right
      if (first.versionNumber < second.versionNumber) {
        setDiff({ oldVersion: first, newVersion: second });
      } else {
        setDiff({ oldVersion: second, newVersion: first });
      }
      setSelectedForCompare(null);
    },
    [selectedForCompare, versions],
  );

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  // If showing diff viewer
  if (diff) {
    return (
      <VersionDiffViewer
        oldValue={diff.oldVersion.content}
        newValue={diff.newVersion.content}
        oldTitle={`v${diff.oldVersion.versionNumber}${diff.oldVersion.versionLabel ? ` — ${diff.oldVersion.versionLabel}` : ''}`}
        newTitle={`v${diff.newVersion.versionNumber}${diff.newVersion.versionLabel ? ` — ${diff.newVersion.versionLabel}` : ''}`}
        onClose={() => setDiff(null)}
      />
    );
  }

  // If previewing a version
  if (previewContent) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-shell-border bg-[#252526] px-3 py-1.5 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Eye className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-gray-300">
              Preview: v{previewContent.version.versionNumber}
              {previewContent.version.versionLabel && (
                <span className="text-gray-500 ml-1">({previewContent.version.versionLabel})</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-amber-400 hover:bg-shell-hover"
              onClick={() => {
                void handleRestore(previewContent.version);
                setPreviewContent(null);
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Restore this
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-gray-500 hover:bg-shell-hover hover:text-gray-300"
              onClick={() => setPreviewContent(null)}
            >
              ×
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
          <pre className="text-xs text-gray-300 font-mono leading-5 whitespace-pre-wrap">
            {previewContent.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header toolbar */}
      <div className="flex items-center justify-between border-b border-shell-border bg-[#252526] px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-medium text-gray-300">
            Version History
          </span>
          <span className="rounded bg-shell-hover px-1.5 py-0.5 text-[10px] text-gray-500">
            {versions.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedForCompare && (
            <button
              type="button"
              className="rounded px-2 py-0.5 text-[10px] text-amber-400 hover:bg-shell-hover"
              onClick={() => setSelectedForCompare(null)}
            >
              Cancel compare
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-purple-500 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-3 w-3" />
            Snapshot
          </button>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
              <History className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">No versions yet</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Create your first snapshot to start tracking changes.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Snapshot
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-shell-border/60" />

            {versions.map((v, idx) => {
              const isFirst = idx === 0;
              const isCompareSelected = selectedForCompare === v.id;
              const isBusy = busy === v.id;

              return (
                <div
                  key={v.id}
                  className={`relative flex items-start gap-3 px-3 py-2.5 transition-colors ${
                    isCompareSelected ? 'bg-blue-500/10' : 'hover:bg-shell-hover/50'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="relative z-[1] mt-0.5 shrink-0">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        isFirst
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-600 bg-[#252526]'
                      }`}
                    >
                      {isFirst && <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {/* Version number + label */}
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-200">
                            <Hash className="h-3 w-3 text-gray-500" />
                            v{v.versionNumber}
                          </span>
                          {v.versionLabel && (
                            <span className="flex items-center gap-0.5 rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-300">
                              <Tag className="h-2.5 w-2.5" />
                              {v.versionLabel}
                            </span>
                          )}
                          {isFirst && (
                            <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] text-green-400">
                              Latest
                            </span>
                          )}
                        </div>

                        {/* Change summary */}
                        {v.changeSummary && (
                          <p className="mt-0.5 text-[11px] text-gray-400 truncate max-w-[300px]">
                            {v.changeSummary}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-600">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTime(v.createdAt)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <User className="h-2.5 w-2.5" />
                            {v.createdBy}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          className="rounded p-1 text-gray-600 hover:bg-shell-hover hover:text-gray-300 transition-colors"
                          title="Preview content"
                          onClick={() => setPreviewContent({ version: v, content: v.content })}
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className={`rounded p-1 transition-colors ${
                            isCompareSelected
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-gray-600 hover:bg-shell-hover hover:text-gray-300'
                          }`}
                          title={selectedForCompare ? 'Compare with this version' : 'Select for compare'}
                          onClick={() => handleCompare(v)}
                        >
                          <GitCompareArrows className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-600 hover:bg-shell-hover hover:text-amber-400 transition-colors"
                          title={`Restore to v${v.versionNumber}`}
                          disabled={isBusy}
                          onClick={() => void handleRestore(v)}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-600 hover:bg-shell-hover hover:text-red-400 transition-colors"
                          title="Delete version"
                          disabled={isBusy}
                          onClick={() => void handleDelete(v)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create version modal */}
      {showCreateModal && (
        <CreateVersionModal
          specFileId={specFileId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            void loadVersions();
          }}
        />
      )}
    </div>
  );
}
