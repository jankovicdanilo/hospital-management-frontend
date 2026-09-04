import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  id?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

export default function MultiSelectDropdown({
  id,
  options,
  selected,
  onChange,
  placeholder,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options;
  }, [options, search]);

  function toggleValue(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} selected`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className={selected.length === 0 ? 'text-gray-500' : 'text-gray-700'}>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-md">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-gray-400">No options.</p>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
