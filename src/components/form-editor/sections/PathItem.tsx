import { useState } from 'react';
import type { PathItemObject, OperationObject, HttpMethod } from '../../../types/openapi.types';
import { HTTP_METHODS } from '../../../types/openapi.types';
import { OperationForm } from './OperationForm';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  path: string;
  pathItem: PathItemObject;
  onChange: (pathItem: PathItemObject) => void;
  onChangePath: (newPath: string) => void;
}

const METHOD_COLORS: Record<string, string> = {
  get: 'text-green-400',
  post: 'text-blue-400',
  put: 'text-amber-400',
  patch: 'text-yellow-400',
  delete: 'text-red-400',
  head: 'text-purple-400',
  options: 'text-pink-400',
  trace: 'text-gray-400',
};

export function PathItem({ path, pathItem, onChange, onChangePath }: Props) {
  const [expanded, setExpanded] = useState(true);

  const activeMethods = HTTP_METHODS.filter(
    (m) => pathItem[m] !== undefined,
  );

  function toggleMethod(method: HttpMethod) {
    if (pathItem[method]) {
      // Remove method
      const next = { ...pathItem };
      delete next[method];
      onChange(next);
    } else {
      // Add method with defaults
      const op: OperationObject = {
        summary: '',
        responses: { '200': { description: 'Successful response' } },
      };
      onChange({ ...pathItem, [method]: op });
    }
  }

  function updateOperation(method: HttpMethod, op: OperationObject) {
    onChange({ ...pathItem, [method]: op });
  }

  return (
    <div className="rounded border border-shell-border bg-[#2a2a2a]">
      {/* Path header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="shrink-0 text-gray-500"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <input
          className="flex-1 border-0 bg-transparent text-xs font-mono text-gray-200 outline-none placeholder:text-gray-600"
          value={path}
          onChange={(e) => onChangePath(e.target.value)}
          placeholder="/users/{id}"
        />
        <div className="flex gap-1">
          {activeMethods.map((m) => (
            <span
              key={m}
              className={`text-[9px] font-bold uppercase ${METHOD_COLORS[m]}`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-shell-border p-3">
          {/* Method toggles */}
          <div className="flex flex-wrap gap-1">
            {HTTP_METHODS.filter((m) => m !== 'trace').map((method) => {
              const active = pathItem[method] !== undefined;
              return (
                <button
                  key={method}
                  type="button"
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                    active
                      ? `${METHOD_COLORS[method]} border border-current/20 bg-current/10`
                      : 'border border-shell-border text-gray-600 hover:text-gray-400'
                  }`}
                  onClick={() => toggleMethod(method)}
                >
                  {method}
                </button>
              );
            })}
          </div>

          {/* Operation forms */}
          {activeMethods.map((method) => (
            <OperationForm
              key={method}
              method={method}
              operation={pathItem[method]!}
              onChange={(op) => updateOperation(method, op)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
