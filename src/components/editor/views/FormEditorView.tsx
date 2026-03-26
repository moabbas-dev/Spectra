import { useCallback, useMemo } from 'react';
import { useEditorStore } from '../../../stores/editor.store';
import { parseOpenApiYaml, serializeOpenApiYaml } from '../../../utils/yaml.util';
import { detectAdvancedYamlConstructs } from '../../../utils/yaml-form-compat';
import type {
  OpenApiDoc, InfoObject, ServerObject, PathItemObject,
  ComponentsObject, TagObject, SecurityRequirementObject,
} from '../../../types/openapi.types';
import { InfoSection } from '../../form-editor/sections/InfoSection';
import { ServersSection } from '../../form-editor/sections/ServersSection';
import { PathsSection } from '../../form-editor/sections/PathsSection';
import { ComponentsSection } from '../../form-editor/sections/ComponentsSection';
import { TagsSection } from '../../form-editor/sections/TagsSection';
import { SecuritySection } from '../../form-editor/sections/SecuritySection';
import { AlertTriangle, Code2 } from 'lucide-react';

interface Props {
  specFileId: string;
}

export function FormEditorView({ specFileId }: Props) {
  const tabs = useEditorStore((s) => s.tabs);
  const setTabContent = useEditorStore((s) => s.setTabContent);
  const setActiveView = useEditorStore((s) => s.setActiveView);
  const tab = tabs.find((t) => t.specFileId === specFileId);

  const doc = useMemo<OpenApiDoc | null>(() => {
    if (!tab) return null;
    return parseOpenApiYaml(tab.content);
  }, [tab?.content]);

  /** Detect advanced YAML constructs the form can't represent */
  const advancedIssues = useMemo<string[]>(() => {
    if (!doc) return [];
    return detectAdvancedYamlConstructs(doc);
  }, [doc]);

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
      {/* ── Advanced YAML degradation banner ── */}
      {advancedIssues.length > 0 && (
        <div className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">
              Advanced YAML — form editing limited
            </p>
            <p className="mt-1 text-xs text-amber-200/70">
              This file contains constructs the form editor cannot fully
              represent. Use the Code view for complete editing.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-amber-300/60 hover:text-amber-300/90">
                {advancedIssues.length} unsupported construct{advancedIssues.length > 1 ? 's' : ''} detected
              </summary>
              <ul className="mt-1 list-inside list-disc text-xs text-amber-200/50">
                {advancedIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </details>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300 transition-colors hover:bg-amber-500/30"
            onClick={() => setActiveView(specFileId, 'code')}
          >
            <Code2 className="h-3 w-3" />
            Switch to Code
          </button>
        </div>
      )}

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

      <ComponentsSection
        components={doc.components ?? {}}
        onChange={(components: ComponentsObject) =>
          updateDoc((d) => ({ ...d, components }))
        }
      />

      <TagsSection
        tags={doc.tags ?? []}
        onChange={(tags: TagObject[]) =>
          updateDoc((d) => ({
            ...d,
            tags: tags.length > 0 ? tags : undefined,
          }))
        }
      />

      <SecuritySection
        security={doc.security ?? []}
        onChange={(security: SecurityRequirementObject[]) =>
          updateDoc((d) => ({
            ...d,
            security: security.length > 0 ? security : undefined,
          }))
        }
      />
    </div>
  );
}


