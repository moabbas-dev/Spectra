import type { ParameterObject } from '../../../types/openapi.types';
import { FormField, inputClass, selectClass, checkboxClass } from '../FormField';
import { FormArrayField } from '../FormArrayField';

interface Props {
  parameters: ParameterObject[];
  onChange: (params: ParameterObject[]) => void;
}

const PARAM_LOCATIONS = ['path', 'query', 'header', 'cookie'] as const;
const SCHEMA_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object'] as const;

export function ParametersForm({ parameters, onChange }: Props) {
  function updateParam(idx: number, partial: Partial<ParameterObject>) {
    const next = parameters.map((p, i) => (i === idx ? { ...p, ...partial } : p));
    onChange(next);
  }

  return (
    <FormArrayField
      items={parameters}
      addLabel="Add Parameter"
      emptyMessage="No parameters."
      onAdd={() =>
        onChange([
          ...parameters,
          { name: '', in: 'query', schema: { type: 'string' } },
        ])
      }
      onRemove={(i) => onChange(parameters.filter((_, idx) => idx !== i))}
      renderItem={(param, i) => (
        <div className="space-y-2 pr-6">
          <div className="grid grid-cols-4 gap-2">
            <FormField label="Name" htmlFor={`param-name-${i}`}>
              <input
                id={`param-name-${i}`}
                className={inputClass}
                value={param.name}
                onChange={(e) => updateParam(i, { name: e.target.value })}
                placeholder="id"
              />
            </FormField>
            <FormField label="In" htmlFor={`param-in-${i}`}>
              <select
                id={`param-in-${i}`}
                className={selectClass}
                value={param.in}
                onChange={(e) =>
                  updateParam(i, { in: e.target.value as ParameterObject['in'] })
                }
              >
                {PARAM_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Type" htmlFor={`param-type-${i}`}>
              <select
                id={`param-type-${i}`}
                className={selectClass}
                value={param.schema?.type ?? 'string'}
                onChange={(e) =>
                  updateParam(i, {
                    schema: { ...param.schema, type: e.target.value },
                  })
                }
              >
                {SCHEMA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Description" htmlFor={`param-desc-${i}`}>
              <input
                id={`param-desc-${i}`}
                className={inputClass}
                value={param.description ?? ''}
                onChange={(e) =>
                  updateParam(i, { description: e.target.value || undefined })
                }
                placeholder="Description..."
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={param.required ?? false}
              onChange={(e) => updateParam(i, { required: e.target.checked })}
            />
            Required
          </label>
        </div>
      )}
    />
  );
}
