import { useRef, useCallback } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '../../../stores/editor.store';

interface Props {
  specFileId: string;
}

export function CodeEditorView({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const setTabContent = useEditorStore((s) => s.setTabContent);
  const tab = tabs.find((t) => t.specFileId === specFileId);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback(
    (ed) => {
      editorRef.current = ed;

      /* Ctrl+Shift+F → format document */
      ed.addAction({
        id: 'spectra.formatDocument',
        label: 'Format Document',
        keybindings: [
          // Monaco keycodes: CtrlCmd + Shift + KeyF
          // eslint-disable-next-line no-bitwise
          (window as any).monaco?.KeyMod.CtrlCmd |
            (window as any).monaco?.KeyMod.Shift |
            (window as any).monaco?.KeyCode.KeyF,
        ].filter(Boolean),
        run: (editor) => {
          editor.getAction('editor.action.formatDocument')?.run();
        },
      });
    },
    [],
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        setTabContent(specFileId, value);
      }
    },
    [specFileId, setTabContent],
  );

  if (!tab) return null;

  return (
    <div className="min-h-0 flex-1">
      <Editor
        height="100%"
        language="yaml"
        theme="spectra-dark"
        value={tab.content}
        onChange={handleChange}
        onMount={handleMount}
        loading={
          <div className="flex h-full items-center justify-center text-xs text-gray-500">
            Loading editor...
          </div>
        }
        beforeMount={(monaco) => {
          /* Define custom dark theme matching Spectra's shell */
          monaco.editor.defineTheme('spectra-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'key', foreground: '9cdcfe' },
              { token: 'string.yaml', foreground: 'ce9178' },
              { token: 'number', foreground: 'b5cea8' },
              { token: 'keyword', foreground: '569cd6' },
              { token: 'comment', foreground: '6a9955' },
              { token: 'type', foreground: '4ec9b0' },
            ],
            colors: {
              'editor.background': '#1e1e1e',
              'editor.foreground': '#d4d4d4',
              'editorLineNumber.foreground': '#858585',
              'editorLineNumber.activeForeground': '#c6c6c6',
              'editor.selectionBackground': '#264f78',
              'editor.inactiveSelectionBackground': '#3a3d41',
              'editorIndentGuide.background': '#404040',
              'editorIndentGuide.activeBackground': '#707070',
              'editor.lineHighlightBackground': '#2a2d2e',
              'editorCursor.foreground': '#aeafad',
              'editorWhitespace.foreground': '#3b3b3b',
            },
          });
        }}
        options={{
          fontSize: 13,
          fontFamily: "'Cascadia Code', 'Consolas', monospace",
          lineNumbers: 'on',
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: true },
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          cursorBlinking: 'smooth',
          folding: true,
          foldingStrategy: 'indentation',
          links: true,
          padding: { top: 8, bottom: 8 },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: { strings: true, other: true, comments: false },
        }}
      />
    </div>
  );
}
