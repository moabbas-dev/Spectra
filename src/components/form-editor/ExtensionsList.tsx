import { useState } from 'react';
import { Plus } from 'lucide-react';
import { inputClass } from './FormField';
import { ConfirmDeleteButton } from '../ui/ConfirmDeleteButton';

interface Props {
  parentObj: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onRemove: (key: string) => void;
}

export function ExtensionsList({ parentObj, onChange, onRemove }: Props) {
  const [newKey, setNewKey] = useState('x-custom');
  const [adding, setAdding] = useState(false);

  const entries = Object.entries(parentObj).filter(([key]) => key.startsWith('x-'));

  if (entries.length === 0 && !adding) {
    return (
      <div className="flex justify-end mt-1">
        <button
          type="button"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors"
          onClick={() => setAdding(true)}
          title="Add custom field starting with x-"
        >
          <Plus className="h-3 w-3" />
          Add x-field
        </button>
      </div>
    );
  }

  function handleAdd() {
    let key = newKey.trim();
    if (!key) return;
    if (!key.startsWith('x-')) key = `x-${key}`;
    onChange(key, '');
    setAdding(false);
    setNewKey('x-custom');
  }

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-shell-border/50">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <div className="w-1/3">
             <input
              type="text"
              readOnly
              value={key}
              className={`${inputClass} opacity-70 bg-transparent border-transparent`}
            />
          </div>
          <div className="flex-1 flex gap-1">
            <input
              type="text"
              className={inputClass}
              value={typeof value === 'string' ? value : JSON.stringify(value)}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder="Value"
            />
            <ConfirmDeleteButton onConfirm={() => onRemove(key)} title={`Remove ${key}`} />
          </div>
        </div>
      ))}
      {adding && (
        <div className="flex items-center gap-1">
           <input
            className={`${inputClass} w-[150px]`}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="x-custom"
            autoFocus
          />
          <button
            type="button"
            className="rounded bg-blue-600 px-2 py-1 text-[10px] text-white hover:bg-blue-500"
            onClick={handleAdd}
          >
            Add
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 text-[10px] text-gray-400 hover:bg-shell-hover"
            onClick={() => setAdding(false)}
          >
            Cancel
          </button>
        </div>
      )}
      {!adding && entries.length > 0 && (
         <div className="flex justify-end mt-1">
           <button
             type="button"
             className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-500 hover:bg-shell-hover hover:text-gray-300 transition-colors"
             onClick={() => setAdding(true)}
           >
             <Plus className="h-3 w-3" />
             Add x-field
           </button>
         </div>
      )}
    </div>
  );
}
