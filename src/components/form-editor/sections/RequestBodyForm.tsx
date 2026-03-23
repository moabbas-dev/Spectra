import type { RequestBodyObject } from '../../../types/openapi.types';
import { FormField, inputClass, textareaClass, checkboxClass } from '../FormField';

interface Props {
  requestBody: RequestBodyObject | undefined;
  onChange: (rb: RequestBodyObject | undefined) => void;
}

export function RequestBodyForm({ requestBody, onChange }: Props) {
  const rb = requestBody ?? { content: { 'application/json': { schema: { type: 'object' } } } };

  function enable() {
    onChange({ content: { 'application/json': { schema: { type: 'object' } } } });
  }

  if (!requestBody) {
    return (
      <button
        type="button"
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        onClick={enable}
      >
        + Add Request Body
      </button>
    );
  }

  const contentType = Object.keys(rb.content ?? {})[0] ?? 'application/json';
  const media = rb.content?.[contentType];

  return (
    <div className="space-y-3 rounded border border-shell-border bg-[#2a2a2a] p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">Request Body</span>
        <button
          type="button"
          className="text-[10px] text-red-400 hover:text-red-300"
          onClick={() => onChange(undefined)}
        >
          Remove
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-400">
        <input
          type="checkbox"
          className={checkboxClass}
          checked={rb.required ?? false}
          onChange={(e) => onChange({ ...rb, required: e.target.checked })}
        />
        Required
      </label>

      <FormField label="Description" htmlFor="rb-desc">
        <textarea
          id="rb-desc"
          className={textareaClass}
          rows={2}
          value={rb.description ?? ''}
          onChange={(e) =>
            onChange({ ...rb, description: e.target.value || undefined })
          }
          placeholder="Describe the request body..."
        />
      </FormField>

      <FormField label="Content Type" htmlFor="rb-ct">
        <input
          id="rb-ct"
          className={inputClass}
          value={contentType}
          onChange={(e) => {
            const newCt = e.target.value;
            const newContent = { [newCt]: media ?? {} };
            onChange({ ...rb, content: newContent });
          }}
          placeholder="application/json"
        />
      </FormField>

      <FormField label="Schema Description" htmlFor="rb-schema-desc">
        <input
          id="rb-schema-desc"
          className={inputClass}
          value={media?.schema?.description ?? ''}
          onChange={(e) => {
            const updatedMedia = {
              ...media,
              schema: {
                ...media?.schema,
                description: e.target.value || undefined,
              },
            };
            onChange({ ...rb, content: { [contentType]: updatedMedia } });
          }}
          placeholder="The schema description..."
        />
      </FormField>
    </div>
  );
}
