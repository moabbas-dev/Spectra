import { useState } from 'react';
import type { OperationObject } from '../../../types/openapi.types';
import { FormField, inputClass, textareaClass } from '../FormField';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ParametersForm } from './ParametersForm';
import { RequestBodyForm } from './RequestBodyForm';
import { ResponsesForm } from './ResponsesForm';
import { ExtensionsList } from '../ExtensionsList';

interface Props {
  method: string;
  operation: OperationObject;
  onChange: (op: OperationObject) => void;
}

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-green-600',
  post: 'bg-blue-600',
  put: 'bg-amber-600',
  patch: 'bg-yellow-600',
  delete: 'bg-red-600',
  head: 'bg-purple-600',
  options: 'bg-pink-600',
  trace: 'bg-gray-600',
};

export function OperationForm({ method, operation, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  function set<K extends keyof OperationObject>(key: K, value: OperationObject[K]) {
    onChange({ ...operation, [key]: value });
  }

  return (
    <div className="rounded border border-shell-border bg-[#252525] ml-3">
      <div 
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-shell-hover select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <button type="button" className="shrink-0 text-gray-500">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${METHOD_COLORS[method] ?? 'bg-gray-600'}`}
        >
          {method}
        </span>
        <span className="text-xs text-gray-400">
          {operation.summary || operation.operationId || 'Operation'}
        </span>
      </div>

      {expanded && (
        <div className="space-y-2 p-2 border-t border-shell-border">
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Summary" htmlFor={`op-summary-${method}`}>
              <input
                id={`op-summary-${method}`}
                className={inputClass}
                value={operation.summary ?? ''}
                onChange={(e) => set('summary', e.target.value || undefined)}
                placeholder="Short summary"
              />
            </FormField>
            <FormField label="Operation ID" htmlFor={`op-id-${method}`}>
              <input
                id={`op-id-${method}`}
                className={inputClass}
                value={operation.operationId ?? ''}
                onChange={(e) => set('operationId', e.target.value || undefined)}
                placeholder="getUsers"
              />
            </FormField>
          </div>

      <FormField label="Description" htmlFor={`op-desc-${method}`}>
        <textarea
          id={`op-desc-${method}`}
          className={textareaClass}
          rows={2}
          value={operation.description ?? ''}
          onChange={(e) => set('description', e.target.value || undefined)}
          placeholder="Detailed operation description..."
        />
      </FormField>

      <FormField label="Tags (comma-separated)" htmlFor={`op-tags-${method}`}>
        <input
          id={`op-tags-${method}`}
          className={inputClass}
          value={(operation.tags ?? []).join(', ')}
          onChange={(e) => {
            const tags = e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
            set('tags', tags.length > 0 ? tags : undefined);
          }}
          placeholder="users, admin"
        />
      </FormField>

      {/* Parameters */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Parameters
        </p>
        <ParametersForm
          parameters={operation.parameters ?? []}
          onChange={(params) => set('parameters', params.length > 0 ? params : undefined)}
        />
      </div>

      {/* Request Body (not for GET/HEAD/DELETE typically) */}
      {!['get', 'head', 'delete'].includes(method) && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Request Body
          </p>
          <RequestBodyForm
            requestBody={operation.requestBody}
            onChange={(rb) => set('requestBody', rb)}
          />
        </div>
      )}

        {/* Responses */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Responses
          </p>
          <ResponsesForm
            responses={operation.responses}
            onChange={(resp) => set('responses', resp)}
          />
        </div>

        <ExtensionsList
          parentObj={operation as any}
          onChange={(key, value) => {
            onChange({ ...operation, [key]: value });
          }}
          onRemove={(key) => {
            const next = { ...operation };
            delete next[key as keyof OperationObject];
            onChange(next);
          }}
        />
      </div>
      )}
    </div>
  );
}
