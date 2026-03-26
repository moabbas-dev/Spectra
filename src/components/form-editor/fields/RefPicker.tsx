import { useState, useMemo, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Props {
  value: string;
  schemaNames: string[];
  onChange: (ref: string) => void;
}

/**
 * Autocomplete dropdown for selecting $ref values from components/schemas.
 */
export function RefPicker({ value, schemaNames, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive the short schema name from a full $ref path
  const displayValue = value.replace('#/components/schemas/', '');

  // Fuzzy filter available schemas
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return schemaNames.filter((name) => name.toLowerCase().includes(q));
  }, [schemaNames, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectSchema(name: string) {
    onChange(`#/components/schemas/${name}`);
    setSearch('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded border border-shell-border bg-[#2d2d2d] py-1.5 pl-7 pr-2.5 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            placeholder={displayValue || 'Search schemas...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
        {value && (
          <span className="shrink-0 rounded bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-400">
            {displayValue}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded border border-shell-border bg-[#252526] shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs italic text-gray-600">
              {schemaNames.length === 0
                ? 'No schemas defined yet'
                : 'No matching schemas'}
            </p>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-[#37373d] transition-colors"
                onClick={() => selectSchema(name)}
              >
                <span className="text-blue-400">$ref</span>
                <span className="truncate text-gray-200">
                  #/components/schemas/{name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
