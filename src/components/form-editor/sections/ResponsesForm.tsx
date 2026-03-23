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

const COMMON_STATUS_CODES = ['200', '201', '204', '400', '401', '403', '404', '500'];

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

  /* Find the next available status code */
  function nextStatusCode(): string {
    const used = new Set(entries.map((e) => e.statusCode));
    for (const code of COMMON_STATUS_CODES) {
      if (!used.has(code)) return code;
    }
    return String(200 + entries.length);
  }

  return (
    <FormArrayField
      items={entries}
      addLabel="Add Response"
      emptyMessage="No responses defined."
      onAdd={() => {
        const code = nextStatusCode();
        onChange({
          ...responses,
          [code]: { description: '' },
        });
      }}
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
                className={inputClass}
                value={entry.statusCode}
                onChange={(e) =>
                  updateEntry(i, { statusCode: e.target.value })
                }
                placeholder="200"
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
  );
}
