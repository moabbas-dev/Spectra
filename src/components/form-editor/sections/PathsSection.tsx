import type { PathItemObject } from '../../../types/openapi.types';
import { FormSection } from '../FormSection';
import { PathItem } from './PathItem';
import { Route, Plus } from 'lucide-react';
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton';

interface Props {
  paths: Record<string, PathItemObject>;
  onChange: (paths: Record<string, PathItemObject>) => void;
}

export function PathsSection({ paths, onChange }: Props) {
  const entries = Object.entries(paths);

  function addPath() {
    let newPath = '/new-path';
    let i = 1;
    while (paths[newPath]) {
      newPath = `/new-path-${i++}`;
    }
    onChange({ ...paths, [newPath]: {} });
  }

  function removePath(path: string) {
    const next = { ...paths };
    delete next[path];
    onChange(next);
  }

  function updatePathItem(oldPath: string, pathItem: PathItemObject) {
    const next = { ...paths, [oldPath]: pathItem };
    onChange(next);
  }

  function renamePath(oldPath: string, newPath: string) {
    if (newPath === oldPath) return;
    const next: Record<string, PathItemObject> = {};
    for (const [k, v] of Object.entries(paths)) {
      next[k === oldPath ? newPath : k] = v;
    }
    onChange(next);
  }

  return (
    <FormSection
      title="Paths"
      icon={<Route className="h-3.5 w-3.5 text-lime-500 " />}
    >
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-xs italic text-gray-600">No paths defined.</p>
        )}
        {entries.map(([path, item]) => (
          <div key={path} className="group relative">
            <div className="absolute -right-3 -top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 bg-[#2a2a2a] shadow rounded border border-shell-border">
              <ConfirmDeleteButton
                onConfirm={() => removePath(path)}
                title={`Remove ${path}`}
              />
            </div>
            <PathItem
              path={path}
              pathItem={item}
              onChange={(pi) => updatePathItem(path, pi)}
              onChangePath={(np) => renamePath(path, np)}
            />
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-dashed border-shell-border px-2.5 py-1.5 text-xs text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
          onClick={addPath}
        >
          <Plus className="h-3 w-3" />
          Add Path
        </button>
      </div>
    </FormSection>
  );
}
