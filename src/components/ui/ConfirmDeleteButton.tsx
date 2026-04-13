import { useState } from 'react';
import { Trash, Check, X } from 'lucide-react';

interface Props {
  onConfirm: () => void;
  title?: string;
  className?: string;
  iconClassName?: string;
}

export function ConfirmDeleteButton({ onConfirm, title = 'Delete', className = '', iconClassName = 'h-3.5 w-3.5' }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          type="button"
          className="rounded p-0.5 text-green-500 hover:bg-green-500/20 transition-colors"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          title="Confirm Delete"
          aria-label="Confirm Delete"
        >
          <Check className={iconClassName} />
        </button>
        <button
          type="button"
          className="rounded p-0.5 text-gray-500 hover:bg-gray-500/20 transition-colors"
          onClick={() => setConfirming(false)}
          title="Cancel"
          aria-label="Cancel"
        >
          <X className={iconClassName} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`rounded p-0.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors ${className}`}
      onClick={() => setConfirming(true)}
      title={title}
      aria-label={title}
    >
      <Trash className={iconClassName} />
    </button>
  );
}
