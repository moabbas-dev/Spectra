import type { ComponentsObject, SchemaObject } from '../../../types/openapi.types';
import { FormSection } from '../FormSection';
import { SchemasForm } from './SchemasForm';
import { Layers } from 'lucide-react';
import { FormField, inputClass, selectClass } from '../FormField';
import { FormArrayField } from '../FormArrayField';

interface Props {
  components: ComponentsObject;
  onChange: (components: ComponentsObject) => void;
}

/**
 * Collapsible form section for OpenAPI components.
 * Renders sub-sections for Schemas, Security Schemes, etc.
 */
export function ComponentsSection({ components, onChange }: Props) {
  const schemaNames = Object.keys(components.schemas ?? {});

  function updateSchemas(schemas: Record<string, SchemaObject>) {
    onChange({
      ...components,
      schemas: Object.keys(schemas).length > 0 ? schemas : undefined,
    });
  }

  function updateSecuritySchemes(schemes: Record<string, unknown>) {
    onChange({
      ...components,
      securitySchemes: Object.keys(schemes).length > 0 ? schemes : undefined,
    });
  }

  return (
    <FormSection
      title="Components"
      icon={<Layers className="h-3.5 w-3.5 text-purple-400" />}
      defaultOpen={false}
    >
      {/* Schemas */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Schemas
        </p>
        <SchemasForm
          schemas={components.schemas ?? {}}
          onChange={updateSchemas}
          schemaNames={schemaNames}
        />
      </div>

      {/* Security Schemes */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Security Schemes
        </p>
        <SecuritySchemesEditor
          schemes={(components.securitySchemes ?? {}) as Record<string, SecuritySchemeObj>}
          onChange={updateSecuritySchemes}
        />
      </div>
    </FormSection>
  );
}

/* ── Security Schemes Editor ── */

interface SecuritySchemeObj {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: string;
  description?: string;
}

interface SecuritySchemesEditorProps {
  schemes: Record<string, SecuritySchemeObj>;
  onChange: (schemes: Record<string, unknown>) => void;
}

function SecuritySchemesEditor({ schemes, onChange }: SecuritySchemesEditorProps) {
  const entries = Object.entries(schemes);

  function updateScheme(key: string, scheme: SecuritySchemeObj) {
    onChange({ ...schemes, [key]: scheme });
  }

  function removeScheme(key: string) {
    const next = { ...schemes };
    delete next[key];
    onChange(next);
  }

  return (
    <FormArrayField
      items={entries}
      addLabel="Add Security Scheme"
      emptyMessage="No security schemes defined."
      onAdd={() => {
        const name = `scheme${entries.length + 1}`;
        onChange({ ...schemes, [name]: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } });
      }}
      onRemove={(i) => {
        const entry = entries[i];
        if (entry) removeScheme(entry[0]);
      }}
      renderItem={([key, scheme]: [string, SecuritySchemeObj], i: number) => (
        <div key={key} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Scheme Name" htmlFor={`ss-name-${i}`}>
              <input
                id={`ss-name-${i}`}
                className={inputClass}
                value={key}
                onChange={(e) => {
                  const newName = e.target.value.trim();
                  if (!newName || newName === key) return;
                  const next = { ...schemes };
                  delete next[key];
                  next[newName] = scheme;
                  onChange(next);
                }}
                placeholder="bearerAuth"
              />
            </FormField>
            <FormField label="Type" htmlFor={`ss-type-${i}`}>
              <select
                id={`ss-type-${i}`}
                className={selectClass}
                value={scheme.type}
                onChange={(e) => updateScheme(key, { ...scheme, type: e.target.value })}
              >
                <option value="http">http</option>
                <option value="apiKey">apiKey</option>
                <option value="oauth2">oauth2</option>
                <option value="openIdConnect">openIdConnect</option>
              </select>
            </FormField>
          </div>
          {scheme.type === 'http' && (
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Scheme" htmlFor={`ss-scheme-${i}`}>
                <input
                  id={`ss-scheme-${i}`}
                  className={inputClass}
                  value={scheme.scheme ?? ''}
                  onChange={(e) => updateScheme(key, { ...scheme, scheme: e.target.value || undefined })}
                  placeholder="bearer"
                />
              </FormField>
              <FormField label="Bearer Format" htmlFor={`ss-bf-${i}`}>
                <input
                  id={`ss-bf-${i}`}
                  className={inputClass}
                  value={scheme.bearerFormat ?? ''}
                  onChange={(e) => updateScheme(key, { ...scheme, bearerFormat: e.target.value || undefined })}
                  placeholder="JWT"
                />
              </FormField>
            </div>
          )}
          {scheme.type === 'apiKey' && (
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Name" htmlFor={`ss-akname-${i}`}>
                <input
                  id={`ss-akname-${i}`}
                  className={inputClass}
                  value={scheme.name ?? ''}
                  onChange={(e) => updateScheme(key, { ...scheme, name: e.target.value || undefined })}
                  placeholder="X-API-Key"
                />
              </FormField>
              <FormField label="In" htmlFor={`ss-akin-${i}`}>
                <select
                  id={`ss-akin-${i}`}
                  className={selectClass}
                  value={scheme.in ?? 'header'}
                  onChange={(e) => updateScheme(key, { ...scheme, in: e.target.value })}
                >
                  <option value="header">header</option>
                  <option value="query">query</option>
                  <option value="cookie">cookie</option>
                </select>
              </FormField>
            </div>
          )}
        </div>
      )}
    />
  );
}
