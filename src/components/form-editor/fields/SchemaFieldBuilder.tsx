import { useState } from 'react';
import type { SchemaObject } from '../../../types/openapi.types';
import { FormField, inputClass, selectClass } from '../FormField';
import { RefPicker } from './RefPicker';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const SCHEMA_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object'] as const;
const STRING_FORMATS = ['', 'date-time', 'date', 'email', 'uri', 'uuid', 'byte', 'binary', 'password'] as const;
const NUMBER_FORMATS = ['', 'int32', 'int64', 'float', 'double'] as const;
const MAX_DEPTH = 6;

interface Props {
  schema: SchemaObject;
  onChange: (schema: SchemaObject) => void;
  schemaNames: string[];
  depth?: number;
  label?: string;
}

/**
 * Recursive schema builder component.
 * Supports: object, array, primitives, $ref, allOf/anyOf/oneOf.
 */
export function SchemaFieldBuilder({
  schema,
  onChange,
  schemaNames,
  depth = 0,
  label,
}: Props) {
  const [expanded, setExpanded] = useState(depth < 2);

  // Determine the "mode" for this schema
  const isRef = Boolean(schema.$ref);
  const hasComposition = Boolean(schema.allOf || schema.anyOf || schema.oneOf);
  const schemaType = schema.type ?? (isRef ? '$ref' : hasComposition ? 'composition' : 'object');

  function set<K extends keyof SchemaObject>(key: K, value: SchemaObject[K]) {
    onChange({ ...schema, [key]: value });
  }

  function setType(type: string) {
    if (type === '$ref') {
      onChange({ $ref: schema.$ref || '' });
      return;
    }
    // Keep description and example when switching types
    const base: SchemaObject = {
      type,
      ...(schema.description ? { description: schema.description } : {}),
    };
    if (type === 'object') {
      base.properties = schema.properties ?? {};
    }
    if (type === 'array') {
      base.items = schema.items ?? { type: 'string' };
    }
    onChange(base);
  }

  // Max depth guard
  if (depth >= MAX_DEPTH) {
    return (
      <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-400">
        Max nesting depth reached. Use Code view for deeper schemas.
      </div>
    );
  }

  const toggleBtn = (
    <button
      type="button"
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
      {label && <span className="font-medium text-gray-300">{label}</span>}
      <span className="text-[10px] text-gray-500">
        {isRef ? `$ref → ${schema.$ref?.replace('#/components/schemas/', '')}` : schemaType}
      </span>
    </button>
  );

  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-3 border-l border-shell-border pl-3' : ''}`}>
      {/* Header with expand toggle */}
      {depth > 0 && toggleBtn}

      {(expanded || depth === 0) && (
        <div className="space-y-2">
          {/* Type selector row */}
          <div className="flex items-center gap-2">
            <select
              className={`${selectClass} max-w-[130px]`}
              value={isRef ? '$ref' : (schema.type ?? 'object')}
              onChange={(e) => setType(e.target.value)}
            >
              {SCHEMA_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="$ref">$ref</option>
            </select>

            {/* Format for string/number/integer */}
            {(schemaType === 'string' || schemaType === 'integer' || schemaType === 'number') && (
              <select
                className={`${selectClass} max-w-[120px]`}
                value={schema.format ?? ''}
                onChange={(e) => set('format', e.target.value || undefined)}
              >
                {(schemaType === 'string' ? STRING_FORMATS : NUMBER_FORMATS).map((f) => (
                  <option key={f} value={f}>{f || '(no format)'}</option>
                ))}
              </select>
            )}

            {/* Nullable toggle */}
            {!isRef && (
              <label className="flex items-center gap-1 text-[10px] text-gray-500">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border-shell-border bg-[#2d2d2d] text-blue-500"
                  checked={schema.nullable ?? false}
                  onChange={(e) => set('nullable', e.target.checked || undefined)}
                />
                nullable
              </label>
            )}
          </div>

          {/* $ref mode */}
          {isRef && (
            <RefPicker
              value={schema.$ref ?? ''}
              schemaNames={schemaNames}
              onChange={(ref) => onChange({ $ref: ref })}
            />
          )}

          {/* Primitive fields */}
          {!isRef && !hasComposition && (
            <>
              <FormField label="Description" htmlFor={`schema-desc-${depth}`}>
                <input
                  id={`schema-desc-${depth}`}
                  className={inputClass}
                  value={schema.description ?? ''}
                  onChange={(e) => set('description', e.target.value || undefined)}
                  placeholder="Schema description"
                />
              </FormField>

              {/* Enum */}
              {(schemaType === 'string' || schemaType === 'integer' || schemaType === 'number') && (
                <FormField label="Enum (comma-separated)" htmlFor={`schema-enum-${depth}`}>
                  <input
                    id={`schema-enum-${depth}`}
                    className={inputClass}
                    value={(schema.enum ?? []).map(String).join(', ')}
                    onChange={(e) => {
                      const vals = e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean);
                      set('enum', vals.length > 0 ? vals : undefined);
                    }}
                    placeholder="value1, value2"
                  />
                </FormField>
              )}

              {/* Example */}
              <FormField label="Example" htmlFor={`schema-example-${depth}`}>
                <input
                  id={`schema-example-${depth}`}
                  className={inputClass}
                  value={schema.example != null ? String(schema.example) : ''}
                  onChange={(e) => set('example', e.target.value || undefined)}
                  placeholder="Example value"
                />
              </FormField>
            </>
          )}

          {/* Object properties */}
          {schemaType === 'object' && !isRef && (
            <ObjectProperties
              properties={schema.properties ?? {}}
              required={schema.required}
              schemaNames={schemaNames}
              depth={depth}
              onChangeProperties={(props) => set('properties', props)}
              onChangeRequired={(req) => set('required', req.length > 0 ? req : undefined)}
            />
          )}

          {/* Array items */}
          {schemaType === 'array' && !isRef && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Array Items
              </p>
              <SchemaFieldBuilder
                schema={schema.items ?? { type: 'string' }}
                onChange={(items) => set('items', items)}
                schemaNames={schemaNames}
                depth={depth + 1}
                label="items"
              />
            </div>
          )}

          {/* Composition: allOf / anyOf / oneOf */}
          {!isRef && (
            <CompositionEditor
              schema={schema}
              onChange={onChange}
              schemaNames={schemaNames}
              depth={depth}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Object Properties sub-component ── */

interface ObjectPropsProps {
  properties: Record<string, SchemaObject>;
  required?: string[];
  schemaNames: string[];
  depth: number;
  onChangeProperties: (props: Record<string, SchemaObject>) => void;
  onChangeRequired: (required: string[]) => void;
}

function ObjectProperties({
  properties,
  required = [],
  schemaNames,
  depth,
  onChangeProperties,
  onChangeRequired,
}: ObjectPropsProps) {
  const [newPropName, setNewPropName] = useState('');
  const entries = Object.entries(properties);

  function addProperty() {
    const name = newPropName.trim();
    if (!name || name in properties) return;
    onChangeProperties({ ...properties, [name]: { type: 'string' } });
    setNewPropName('');
  }

  function removeProperty(name: string) {
    const next = { ...properties };
    delete next[name];
    onChangeProperties(next);
    onChangeRequired(required.filter((r) => r !== name));
  }

  function updateProperty(name: string, schema: SchemaObject) {
    onChangeProperties({ ...properties, [name]: schema });
  }

  function toggleRequired(name: string) {
    if (required.includes(name)) {
      onChangeRequired(required.filter((r) => r !== name));
    } else {
      onChangeRequired([...required, name]);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Properties ({entries.length})
      </p>

      {entries.map(([name, propSchema]) => (
        <div key={name} className="group relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-300">{name}</span>
            <label className="flex items-center gap-1 text-[10px] text-gray-600">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-shell-border bg-[#2d2d2d] text-blue-500"
                checked={required.includes(name)}
                onChange={() => toggleRequired(name)}
              />
              required
            </label>
            <button
              type="button"
              className="ml-auto rounded p-0.5 text-gray-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              onClick={() => removeProperty(name)}
              aria-label={`Remove ${name}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <SchemaFieldBuilder
            schema={propSchema}
            onChange={(s) => updateProperty(name, s)}
            schemaNames={schemaNames}
            depth={depth + 1}
            label={name}
          />
        </div>
      ))}

      {/* Add property */}
      <div className="flex items-center gap-1">
        <input
          className={`${inputClass} max-w-[160px]`}
          value={newPropName}
          onChange={(e) => setNewPropName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addProperty()}
          placeholder="Property name"
        />
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-dashed border-shell-border px-2 py-1.5 text-xs text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
          onClick={addProperty}
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  );
}

/* ── Composition Editor (allOf / anyOf / oneOf) ── */

interface CompositionProps {
  schema: SchemaObject;
  onChange: (schema: SchemaObject) => void;
  schemaNames: string[];
  depth: number;
}

function CompositionEditor({ schema, onChange, schemaNames, depth }: CompositionProps) {
  const compositionTypes = ['allOf', 'anyOf', 'oneOf'] as const;

  function addCompositionItem(key: 'allOf' | 'anyOf' | 'oneOf') {
    const current = (schema[key] as SchemaObject[] | undefined) ?? [];
    onChange({ ...schema, [key]: [...current, { type: 'object' }] });
  }

  function removeCompositionItem(key: 'allOf' | 'anyOf' | 'oneOf', index: number) {
    const current = (schema[key] as SchemaObject[] | undefined) ?? [];
    const next = current.filter((_, i) => i !== index);
    onChange({ ...schema, [key]: next.length > 0 ? next : undefined });
  }

  function updateCompositionItem(key: 'allOf' | 'anyOf' | 'oneOf', index: number, s: SchemaObject) {
    const current = (schema[key] as SchemaObject[] | undefined) ?? [];
    const next = [...current];
    next[index] = s;
    onChange({ ...schema, [key]: next });
  }

  const hasAny = compositionTypes.some((k) => schema[k] && (schema[k] as SchemaObject[]).length > 0);

  return (
    <div className="space-y-2">
      {/* Composition toggle buttons */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-600 mr-1">Compose:</span>
        {compositionTypes.map((key) => {
          const items = (schema[key] as SchemaObject[] | undefined) ?? [];
          const active = items.length > 0;
          return (
            <button
              key={key}
              type="button"
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-[#2d2d2d] text-gray-600 hover:text-gray-400'
              }`}
              onClick={() => {
                if (active) {
                  // Remove this composition
                  onChange({ ...schema, [key]: undefined });
                } else {
                  addCompositionItem(key);
                }
              }}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Render composition items */}
      {hasAny &&
        compositionTypes.map((key) => {
          const items = (schema[key] as SchemaObject[] | undefined) ?? [];
          if (items.length === 0) return null;

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                  {key}
                </span>
                <button
                  type="button"
                  className="text-[10px] text-gray-600 hover:text-blue-400"
                  onClick={() => addCompositionItem(key)}
                >
                  + add
                </button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="group relative">
                  <button
                    type="button"
                    className="absolute -left-2 top-0 rounded p-0.5 text-gray-600 opacity-0 hover:text-red-400 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCompositionItem(key, i)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <SchemaFieldBuilder
                    schema={item}
                    onChange={(s) => updateCompositionItem(key, i, s)}
                    schemaNames={schemaNames}
                    depth={depth + 1}
                    label={`${key}[${i}]`}
                  />
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
}
