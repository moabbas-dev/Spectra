import { useState } from 'react';
import type { SchemaObject } from '../../../types/openapi.types';
import { SchemaFieldBuilder } from '../fields/SchemaFieldBuilder';
import { inputClass } from '../FormField';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  schemas: Record<string, SchemaObject>;
  onChange: (schemas: Record<string, SchemaObject>) => void;
  /** All available schema names for $ref picking */
  schemaNames: string[];
}

/**
 * Named schema editor for components.schemas.
 * Lists schemas with expand/collapse, add/remove support.
 */
export function SchemasForm({ schemas, onChange, schemaNames }: Props) {
  const [newName, setNewName] = useState('');
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const entries = Object.entries(schemas);

  function addSchema() {
    const name = newName.trim();
    if (!name || name in schemas) return;
    onChange({ ...schemas, [name]: { type: 'object', properties: {} } });
    setNewName('');
    setExpandedSchemas((prev) => new Set(prev).add(name));
  }

  function removeSchema(name: string) {
    const next = { ...schemas };
    delete next[name];
    onChange(next);
  }

  function updateSchema(name: string, schema: SchemaObject) {
    onChange({ ...schemas, [name]: schema });
  }

  function toggleExpanded(name: string) {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <p className="text-xs italic text-gray-600">No schemas defined.</p>
      )}

      {entries.map(([name, schema]) => {
        const isExpanded = expandedSchemas.has(name);
        return (
          <div
            key={name}
            className="rounded border border-shell-border bg-[#2a2a2a]"
          >
            {/* Schema header */}
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-200 transition-colors"
                onClick={() => toggleExpanded(name)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              <span className="text-xs font-semibold text-blue-400">{name}</span>
              <span className="text-[10px] text-gray-600">{schema.type ?? '$ref'}</span>
              <button
                type="button"
                className="ml-auto rounded p-1 text-gray-600 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                onClick={() => removeSchema(name)}
                aria-label={`Remove schema ${name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {/* Schema body */}
            {isExpanded && (
              <div className="border-t border-shell-border px-3 py-3">
                <SchemaFieldBuilder
                  schema={schema}
                  onChange={(s) => updateSchema(name, s)}
                  schemaNames={schemaNames}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add schema */}
      <div className="flex items-center gap-1">
        <input
          className={`${inputClass} max-w-[180px]`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSchema()}
          placeholder="Schema name (e.g. User)"
        />
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-dashed border-shell-border px-2.5 py-1.5 text-xs text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
          onClick={addSchema}
        >
          <Plus className="h-3 w-3" />
          Add Schema
        </button>
      </div>
    </div>
  );
}
