import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function getMonthGrid(viewMonth: Date): Date[] {
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = addDays(firstOfMonth, -mondayOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  isDayDisabled?: (date: Date) => boolean;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
}

export default function DatePicker({
  id,
  value,
  onChange,
  min,
  isDayDisabled,
  disabled = false,
  placeholder = 'Select a date…',
  hasError = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value ? parseIso(value) : startOfDay(new Date())));
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

  function toggleOpen() {
    if (disabled) {
      return;
    }
    if (!open) {
      setViewMonth(value ? parseIso(value) : startOfDay(new Date()));
    }
    setOpen((prev) => !prev);
  }

  function isDateDisabled(date: Date): boolean {
    if (min && toIso(date) < min) {
      return true;
    }
    return isDayDisabled ? isDayDisabled(date) : false;
  }

  const days = getMonthGrid(viewMonth);
  const today = startOfDay(new Date());
  const selected = value ? parseIso(value) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        }`}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value
            ? parseIso(value).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : placeholder}
        </span>
        <Calendar className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-[11px] font-medium uppercase text-gray-400">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday = isSameDay(day, today);
              const isDisabled = !inMonth || isDateDisabled(day);

              let cls = 'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ';
              if (isSelected) {
                cls += 'bg-blue-600 text-white font-semibold';
              } else if (isDisabled) {
                cls += 'text-gray-300 cursor-not-allowed';
              } else if (isToday) {
                cls += 'border border-blue-300 text-blue-700 hover:bg-blue-50';
              } else {
                cls += 'text-gray-700 hover:bg-gray-50';
              }

              return (
                <button
                  key={toIso(day)}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(toIso(day));
                    setOpen(false);
                  }}
                  className={cls}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
