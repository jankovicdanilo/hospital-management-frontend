import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';

export interface SearchableSelectOption {
  id: string | number;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  fetchOptions: (search: string) => Promise<SearchableSelectOption[]>;
  /** Default (pre-search) options shown as soon as the dropdown opens, before the user types anything. */
  fetchPopularOptions?: () => Promise<SearchableSelectOption[]>;
  placeholder?: string;
  disabled?: boolean;
  /** Label to show for a pre-selected `value` before any search has run (e.g. when pre-filling an edit form). */
  initialLabel?: string;
  hasError?: boolean;
}

const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_MS = 300;

export default function SearchableSelect({
  id,
  value,
  onChange,
  fetchOptions,
  fetchPopularOptions,
  placeholder = 'Search…',
  disabled = false,
  initialLabel,
  hasError = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(value != null ? initialLabel ?? null : null);
  const [popularOptions, setPopularOptions] = useState<SearchableSelectOption[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [popularError, setPopularError] = useState('');
  const [popularLoaded, setPopularLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Held in a ref (not a dependency) so parent components can pass a fresh
  // closure on every render without re-triggering the search effect below.
  const fetchOptionsRef = useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;
  const fetchPopularOptionsRef = useRef(fetchPopularOptions);
  fetchPopularOptionsRef.current = fetchPopularOptions;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (value == null) {
      setSelectedLabel(null);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
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
    if (query.trim().length < MIN_SEARCH_LENGTH) {
      setOptions([]);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      fetchOptionsRef
        .current(query.trim())
        .then((results) => {
          if (!cancelled) {
            setOptions(results);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
            setError('Failed to load results.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function ensurePopularLoaded() {
    if (!fetchPopularOptionsRef.current || popularLoaded || loadingPopular) {
      return;
    }

    setLoadingPopular(true);
    setPopularError('');

    fetchPopularOptionsRef
      .current()
      .then((results) => {
        if (mountedRef.current) {
          setPopularOptions(results);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setPopularError('Failed to load results.');
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setPopularLoaded(true);
          setLoadingPopular(false);
        }
      });
  }

  function toggleOpen() {
    if (disabled) {
      return;
    }
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setQuery('');
        setOptions([]);
        ensurePopularLoaded();
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return next;
    });
  }

  function handleSelect(option: SearchableSelectOption) {
    setSelectedLabel(option.label);
    onChange(option.id);
    setOpen(false);
    setQuery('');
  }

  function handleClear(e: MouseEvent) {
    e.stopPropagation();
    setSelectedLabel(null);
    onChange(null);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        }`}
      >
        <span className={`truncate ${selectedLabel ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedLabel ?? placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {selectedLabel && !disabled && (
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" onClick={handleClear} />
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-[240px] rounded-2xl border border-gray-100 bg-white p-2 shadow-md">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="max-h-60 overflow-y-auto">
            {query.trim().length === 0 && fetchPopularOptions ? (
              loadingPopular ? (
                <p className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </p>
              ) : popularError ? (
                <p className="px-2 py-1.5 text-sm text-red-600">{popularError}</p>
              ) : popularOptions.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-gray-400">No results found.</p>
              ) : (
                <>
                  <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Most booked
                  </p>
                  {popularOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </>
              )
            ) : query.trim().length < MIN_SEARCH_LENGTH ? (
              <p className="px-2 py-1.5 text-sm text-gray-400">
                Type at least {MIN_SEARCH_LENGTH} characters to search.
              </p>
            ) : loading ? (
              <p className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
              </p>
            ) : error ? (
              <p className="px-2 py-1.5 text-sm text-red-600">{error}</p>
            ) : options.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-gray-400">No results found.</p>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
