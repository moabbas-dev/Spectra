import type { TagObject, ExternalDocObject } from '../../../types/openapi.types';
import { FormSection } from '../FormSection';
import { FormArrayField } from '../FormArrayField';
import { FormField, inputClass } from '../FormField';
import { Tag } from 'lucide-react';

interface Props {
  tags: TagObject[];
  onChange: (tags: TagObject[]) => void;
}

/**
 * Form section for editing OpenAPI tags[].
 * Each tag has a name, description, and optional externalDocs URL.
 */
export function TagsSection({ tags, onChange }: Props) {
  function updateTag(index: number, tag: TagObject) {
    const next = [...tags];
    next[index] = tag;
    onChange(next);
  }

  return (
    <FormSection
      title="Tags"
      icon={<Tag className="h-3.5 w-3.5 text-green-500" />}
      defaultOpen={false}
    >
      <FormArrayField
        items={tags}
        addLabel="Add Tag"
        emptyMessage="No tags defined."
        onAdd={() =>
          onChange([...tags, { name: '', description: '' }])
        }
        onRemove={(i) => onChange(tags.filter((_, idx) => idx !== i))}
        renderItem={(tag: TagObject, i: number) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Name" htmlFor={`tag-name-${i}`}>
                <input
                  id={`tag-name-${i}`}
                  className={inputClass}
                  value={tag.name}
                  onChange={(e) =>
                    updateTag(i, { ...tag, name: e.target.value })
                  }
                  placeholder="users"
                />
              </FormField>
              <FormField label="Docs URL" htmlFor={`tag-docs-${i}`}>
                <input
                  id={`tag-docs-${i}`}
                  className={inputClass}
                  value={tag.externalDocs?.url ?? ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    const externalDocs: ExternalDocObject | undefined = url
                      ? { url, description: tag.externalDocs?.description }
                      : undefined;
                    updateTag(i, { ...tag, externalDocs });
                  }}
                  placeholder="https://docs.example.com/users"
                />
              </FormField>
            </div>
            <FormField label="Description" htmlFor={`tag-desc-${i}`}>
              <input
                id={`tag-desc-${i}`}
                className={inputClass}
                value={tag.description ?? ''}
                onChange={(e) =>
                  updateTag(i, {
                    ...tag,
                    description: e.target.value || undefined,
                  })
                }
                placeholder="Operations related to users"
              />
            </FormField>
          </div>
        )}
      />
    </FormSection>
  );
}
