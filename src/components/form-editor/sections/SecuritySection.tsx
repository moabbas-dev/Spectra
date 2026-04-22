import type { SecurityRequirementObject } from '../../../types/openapi.types';
import { FormSection } from '../FormSection';
import { FormArrayField } from '../FormArrayField';
import { FormField, inputClass } from '../FormField';
import { Shield } from 'lucide-react';

interface Props {
  security: SecurityRequirementObject[];
  onChange: (security: SecurityRequirementObject[]) => void;
  collapseToken?: number;
}

/**
 * Form section for editing global security[] requirements.
 * Each requirement maps a scheme name to its scopes.
 */
export function SecuritySection({ security, onChange, collapseToken }: Props) {
  function updateRequirement(index: number, req: SecurityRequirementObject) {
    const next = [...security];
    next[index] = req;
    onChange(next);
  }

  return (
    <FormSection
      title="Security"
      icon={<Shield className="h-3.5 w-3.5 text-amber-500" />}
      defaultOpen={false}
      collapseToken={collapseToken}
    >
      <FormArrayField
        items={security}
        addLabel="Add Requirement"
        emptyMessage="No global security requirements."
        onAdd={() => onChange([...security, { bearerAuth: [] }])}
        onRemove={(i) => onChange(security.filter((_, idx) => idx !== i))}
        renderItem={(req: SecurityRequirementObject, i: number) => {
          // Get the first (and usually only) entry
          const entries = Object.entries(req);
          const [schemeName, scopes] = entries[0] ?? ['', []];

          return (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Scheme Name" htmlFor={`sec-name-${i}`}>
                  <input
                    id={`sec-name-${i}`}
                    className={inputClass}
                    value={schemeName}
                    onChange={(e) => {
                      const newName = e.target.value.trim();
                      if (!newName) return;
                      updateRequirement(i, { [newName]: scopes });
                    }}
                    placeholder="bearerAuth"
                  />
                </FormField>
                <FormField
                  label="Scopes (comma-separated)"
                  htmlFor={`sec-scopes-${i}`}
                >
                  <input
                    id={`sec-scopes-${i}`}
                    className={inputClass}
                    value={(scopes ?? []).join(', ')}
                    onChange={(e) => {
                      const newScopes = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      updateRequirement(i, { [schemeName]: newScopes });
                    }}
                    placeholder="read:users, write:users"
                  />
                </FormField>
              </div>
            </div>
          );
        }}
      />
    </FormSection>
  );
}
