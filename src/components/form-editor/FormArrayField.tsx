import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { ConfirmDeleteButton } from '../ui/ConfirmDeleteButton';

interface Props<T> {
  items: T[];
  onAdd?: () => void;
  onRemove: (index: number) => void;
  addLabel?: string;
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}

export function FormArrayField<T>({
  items,
  onAdd,
  onRemove,
  addLabel = 'Add',
  renderItem,
  emptyMessage = 'No items yet.',
}: Props<T>) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-xs italic text-gray-600">{emptyMessage}</p>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          className="group relative rounded border border-shell-border bg-[#2a2a2a] p-3"
        >
          <ConfirmDeleteButton
            onConfirm={() => onRemove(i)}
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            title="Remove item"
          />
          {renderItem(item, i)}
        </div>
      ))}
      {onAdd && (
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-dashed border-shell-border px-2.5 py-1.5 text-xs text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          {addLabel}
        </button>
      )}
    </div>
  );
}
