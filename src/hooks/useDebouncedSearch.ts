import { useEffect, useRef, useState } from 'react';

const DEFAULT_MIN_LENGTH = 3;
const DEFAULT_DEBOUNCE_MS = 300;

interface UseDebouncedSearchOptions {
  minLength?: number;
  debounceMs?: number;
  /**
   * Called synchronously in the same debounce tick that updates `search`, so
   * callers can batch extra state (e.g. resetting a page number) into the
   * same React render instead of a separate effect — avoiding an extra
   * render/fetch cycle with a stale value in between.
   */
  onChange?: (search: string) => void;
}

/** Debounces free-typed input into a `search` value, gated by a minimum length. */
export function useDebouncedSearch({
  minLength = DEFAULT_MIN_LENGTH,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onChange,
}: UseDebouncedSearchOptions = {}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const next = trimmed.length >= minLength ? trimmed : '';
      setSearch(next);
      onChangeRef.current?.(next);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchInput, minLength, debounceMs]);

  return { searchInput, setSearchInput, search };
}
