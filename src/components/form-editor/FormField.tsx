import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, htmlFor, children, hint }: Props) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-gray-400"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

/* ── shared input classes ── */
export const inputClass =
  'w-full rounded border border-shell-border bg-[#2d2d2d] px-2.5 py-1.5 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors';

export const textareaClass = `${inputClass} resize-y min-h-[60px]`;

export const selectClass = inputClass;

export const checkboxClass =
  'h-3.5 w-3.5 rounded border-shell-border bg-[#2d2d2d] text-blue-500 focus:ring-blue-500/30';
