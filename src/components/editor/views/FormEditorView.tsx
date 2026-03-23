import { useCallback, useMemo } from 'react';
import { useEditorStore } from '../../../stores/editor.store';
import { parseOpenApiYaml, serializeOpenApiYaml } from '../../../utils/yaml.util';
import type { OpenApiDoc, InfoObject, ServerObject, PathItemObject } from '../../../types/openapi.types';
import { InfoSection } from '../../form-editor/sections/InfoSection';
import { ServersSection } from '../../form-editor/sections/ServersSection';
import { PathsSection } from '../../form-editor/sections/PathsSection';
import { AlertTriangle } from 'lucide-react';

interface Props {
  specFileId: string;
}

export function FormEditorView({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const setTabContent = useEditorStore((s) => s.setTabContent);
  const tab = tabs.find((t) => t.specFileId === specFileId);

  const doc = useMemo<OpenApiDoc | null>(() => {
    if (!tab) return null;
    return parseOpenApiYaml(tab.content);
  }, [tab?.content]);

  const updateDoc = useCallback(
    (updater: (d: OpenApiDoc) => OpenApiDoc) => {
      if (!doc) return;
      const next = updater(doc);
      const yaml = serializeOpenApiYaml(next);
      setTabContent(specFileId, yaml);
    },
    [doc, specFileId, setTabContent],
  );

  if (!tab) return null;

  if (!doc) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm text-gray-300">Unable to parse YAML</p>
        <p className="text-xs text-gray-500">
          Switch to Code view to fix syntax errors, then come back to Form view.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <InfoSection
        info={doc.info ?? { title: '', version: '' }}
        onChange={(info: InfoObject) => updateDoc((d) => ({ ...d, info }))}
      />

      <ServersSection
        servers={doc.servers ?? []}
        onChange={(servers: ServerObject[]) =>
          updateDoc((d) => ({
            ...d,
            servers: servers.length > 0 ? servers : undefined,
          }))
        }
      />

      <PathsSection
        paths={doc.paths ?? {}}
        onChange={(paths: Record<string, PathItemObject>) =>
          updateDoc((d) => ({ ...d, paths }))
        }
      />
    </div>
  );
}
