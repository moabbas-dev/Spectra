import { useState, useEffect, useRef } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import * as yaml from 'js-yaml';
import { useEditorStore } from '../../../stores/editor.store';

interface Props {
  specFileId: string;
}

/**
 * Live Swagger UI preview of the current spec file.
 * Converts YAML → JSON for swagger-ui-react, debounced on content change.
 */
export function PreviewView({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const tab = tabs.find((t) => t.specFileId === specFileId);
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce YAML → JSON parsing (300ms)
  useEffect(() => {
    if (!tab) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const doc = yaml.load(tab.content);
        if (doc && typeof doc === 'object') {
          setSpec(doc as Record<string, unknown>);
          setError(null);
        } else {
          setSpec(null);
          setError('Invalid or empty YAML document');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'YAML parse error');
        setSpec(null);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [tab?.content]);

  if (!tab) return null;

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Preview Unavailable</p>
          <p className="mt-1 text-xs text-red-300/70">{error}</p>
        </div>
        <p className="text-xs text-gray-500">
          Fix YAML errors in Code view, then return to Preview.
        </p>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-gray-500">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <style>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 16px 0; }
        .swagger-ui .scheme-container { padding: 8px 0; }
      `}</style>
      <SwaggerUI spec={spec} />
    </div>
  );
}
