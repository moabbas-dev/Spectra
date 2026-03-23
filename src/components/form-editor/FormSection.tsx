import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FormSection({ title, icon, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-shell-border">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:bg-shell-hover hover:text-gray-200 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        {title}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
