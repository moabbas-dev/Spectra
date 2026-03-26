import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editor.store';
import { useValidationStore, type ValidationIssue } from '../stores/validation.store';
import { useIPC } from './useIPC';
import { IPC } from '@shared/ipc-channels';

const VALIDATION_DEBOUNCE_MS = 500;

export function useRealtimeValidation() {
  const ipc = useIPC();
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.specFileId === activeTabId);

  const setIssues = useValidationStore((s) => s.setIssues);
  const setIsValidating = useValidationStore((s) => s.setIsValidating);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastValidatedContent = useRef<string | null>(null);

  useEffect(() => {
    // If no tab is active, clear issues
    if (!activeTab) {
      setIssues([]);
      setIsValidating(false);
      lastValidatedContent.current = null;
      return;
    }

    // Unchanged content doesn't need revalidation
    if (activeTab.content === lastValidatedContent.current) {
      return;
    }

    setIsValidating(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const issues = await ipc<ValidationIssue[]>(IPC.VALIDATE_SPEC, activeTab.content);
        setIssues(issues);
        lastValidatedContent.current = activeTab.content;
      } catch (err) {
        console.error('Validation failed', err);
        setIssues([]);
      } finally {
        setIsValidating(false);
      }
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeTab?.content, activeTab?.filePath, ipc, setIssues, setIsValidating]);
}
