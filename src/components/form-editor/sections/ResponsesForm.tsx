import { useState } from 'react';
import type { ResponseObject } from '../../../types/openapi.types';
import { FormField, inputClass, textareaClass } from '../FormField';
import { FormArrayField } from '../FormArrayField';

interface ResponseEntry {
  statusCode: string;
  response: ResponseObject;
}

interface Props {
  responses: Record<string, ResponseObject> | undefined;
  onChange: (responses: Record<string, ResponseObject>) => void;
}


export function ResponsesForm({ responses, onChange }: Props) {
  const entries: ResponseEntry[] = Object.entries(responses ?? {}).map(
    ([statusCode, response]) => ({ statusCode, response }),
  );

  function fromEntries(items: ResponseEntry[]): Record<string, ResponseObject> {
    const result: Record<string, ResponseObject> = {};
    for (const item of items) {
      result[item.statusCode] = item.response;
    }
    return result;
  }

  function updateEntry(idx: number, partial: Partial<ResponseEntry>) {
    const next = entries.map((e, i) =>
      i === idx ? { ...e, ...partial } : e,
    );
    onChange(fromEntries(next));
  }

  const [newStatusCode, setNewStatusCode] = useState('');
  const [newDescription, setNewDescription] = useState('');

  function handleAddResponse() {
    if (!newStatusCode.trim()) return;
    onChange({
      ...responses,
      [newStatusCode.trim()]: { description: newDescription },
    });
    setNewStatusCode('');
    setNewDescription('');
  }

  return (
    <div className="space-y-4">
      <FormArrayField
        items={entries}
        emptyMessage="No responses defined."
        onRemove={(i) => {
        const next = [...entries];
        next.splice(i, 1);
        onChange(fromEntries(next));
      }}
      renderItem={(entry, i) => (
        <div className="space-y-2 pr-6">
          <div className="grid grid-cols-3 gap-2">
            <FormField label="Status Code" htmlFor={`resp-code-${i}`}>
              <input
                id={`resp-code-${i}`}
                className={`${inputClass} opacity-70 cursor-not-allowed`}
                value={entry.statusCode}
                readOnly
                title="Status Code cannot be changed. Delete and recreate if needed."
              />
            </FormField>
            <div className="col-span-2">
              <FormField label="Description" htmlFor={`resp-desc-${i}`}>
                <textarea
                  id={`resp-desc-${i}`}
                  className={textareaClass}
                  rows={2}
                  value={entry.response.description}
                  onChange={(e) =>
                    updateEntry(i, {
                      response: {
                        ...entry.response,
                        description: e.target.value,
                      },
                    })
                  }
                  placeholder="Response description..."
                />
              </FormField>
            </div>
          </div>
        </div>
      )}
      />

      {/* Add New Response Form */}
      <div className="rounded border border-dashed border-shell-border bg-[#1e1e1e] p-3 space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">Add New Response</h4>
        <div className="grid grid-cols-3 gap-2 items-start">
          <FormField label="Status Code *" htmlFor="new-resp-code">
            <input
              id="new-resp-code"
              className={inputClass}
              value={newStatusCode}
              onChange={(e) => {const x = e.target.value; if (!isNaN(Number(x)) && x.length <= 3) {setNewStatusCode(x);}}}
              placeholder="e.g. 200, 404, default"
            />
          </FormField>
          <div className="col-span-2">
            <FormField label="Description" htmlFor="new-resp-desc">
              <textarea
                id="new-resp-desc"
                className={textareaClass}
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Response description..."
              />
            </FormField>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleAddResponse}
            disabled={!newStatusCode.trim() || newStatusCode.length !== 3}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            Add Response
          </button>
        </div>
      </div>
    </div>
  );
}
