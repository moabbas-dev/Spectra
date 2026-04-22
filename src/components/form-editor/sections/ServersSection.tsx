import type { ServerObject } from '../../../types/openapi.types';
import { FormSection } from '../FormSection';
import { FormField, inputClass } from '../FormField';
import { FormArrayField } from '../FormArrayField';
import { Server } from 'lucide-react';

interface Props {
  servers: ServerObject[];
  onChange: (servers: ServerObject[]) => void;
  collapseToken?: number;
}

export function ServersSection({ servers, onChange, collapseToken }: Props) {
  function updateServer(idx: number, partial: Partial<ServerObject>) {
    const next = servers.map((s, i) => (i === idx ? { ...s, ...partial } : s));
    onChange(next);
  }

  return (
    <FormSection
      title="Servers"
      icon={<Server className="h-3.5 w-3.5 text-orange-500" />}
      collapseToken={collapseToken}
    >
      <FormArrayField
        items={servers}
        addLabel="Add Server"
        emptyMessage="No servers defined."
        onAdd={() => onChange([...servers, { url: '' }])}
        onRemove={(i) => onChange(servers.filter((_, idx) => idx !== i))}
        renderItem={(srv, i) => (
          <div className="grid grid-cols-2 gap-3 pr-6">
            <FormField label="URL" htmlFor={`srv-url-${i}`}>
              <input
                id={`srv-url-${i}`}
                className={inputClass}
                value={srv.url}
                onChange={(e) => updateServer(i, { url: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </FormField>
            <FormField label="Description" htmlFor={`srv-desc-${i}`}>
              <input
                id={`srv-desc-${i}`}
                className={inputClass}
                value={srv.description ?? ''}
                onChange={(e) =>
                  updateServer(i, {
                    description: e.target.value || undefined,
                  })
                }
                placeholder="Production server"
              />
            </FormField>
          </div>
        )}
      />
    </FormSection>
  );
}
