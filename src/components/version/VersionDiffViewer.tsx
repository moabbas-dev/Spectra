import { useMemo } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { X } from 'lucide-react';

interface Props {
  oldValue: string;
  newValue: string;
  oldTitle: string;
  newTitle: string;
  onClose: () => void;
}

const darkStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1e1e1e',
      diffViewerColor: '#d4d4d4',
      addedBackground: '#1e3a2a',
      addedColor: '#b5e8c3',
      removedBackground: '#3a1e1e',
      removedColor: '#e8b5b5',
      wordAddedBackground: '#2ea04333',
      wordRemovedBackground: '#e0434333',
      addedGutterBackground: '#1a3025',
      removedGutterBackground: '#301a1a',
      gutterBackground: '#252526',
      gutterBackgroundDark: '#1e1e1e',
      highlightBackground: '#264f78',
      highlightGutterBackground: '#264f78',
      codeFoldBackground: '#2d2d2d',
      codeFoldGutterBackground: '#2d2d2d',
      codeFoldContentColor: '#808080',
      emptyLineBackground: '#1e1e1e',
    },
  },
  line: {
    padding: '1px 8px',
    fontSize: '12px',
    fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
    lineHeight: '20px',
  },
  gutter: {
    minWidth: '35px',
    padding: '0 8px',
    fontSize: '11px',
  },
  contentText: {
    fontSize: '12px',
    lineHeight: '20px',
  },
};

export function VersionDiffViewer({ oldValue, newValue, oldTitle, newTitle, onClose }: Props) {
  const memoizedOld = useMemo(() => oldValue, [oldValue]);
  const memoizedNew = useMemo(() => newValue, [newValue]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Diff header */}
      <div className="flex items-center justify-between border-b border-shell-border bg-[#252526] px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-red-400/80">{oldTitle}</span>
          <span className="text-gray-600">↔</span>
          <span className="text-green-400/80">{newTitle}</span>
        </div>
        <button
          type="button"
          className="rounded p-0.5 text-gray-500 hover:bg-shell-hover hover:text-gray-300"
          onClick={onClose}
          title="Close diff"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        <ReactDiffViewer
          oldValue={memoizedOld}
          newValue={memoizedNew}
          splitView={true}
          compareMethod={DiffMethod.LINES}
          useDarkTheme={true}
          styles={darkStyles}
          leftTitle={undefined}
          rightTitle={undefined}
        />
      </div>
    </div>
  );
}
