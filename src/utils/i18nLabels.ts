import type { TFunction } from 'i18next';
import type { AppointmentStatus } from '../types/appointment';
import type { DayOfWeek } from '../types/doctorSchedule';

export function translateStatus(t: TFunction, status: AppointmentStatus): string {
  return t(`status.${status.toLowerCase()}`);
}

export function translateDayOfWeek(t: TFunction, day: DayOfWeek): string {
  return t(`days.${day.toLowerCase()}`);
}

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

// Formats a date as a localized short month + day (e.g. "Sep 28" in English,
// "28. sep" in Montenegrin), driven by the `monthsShort` / `appointments.monthDay`
// translations rather than a hardcoded locale.
export function formatMonthDay(t: TFunction, date: Date): string {
  return t('appointments.monthDay', {
    month: t(`monthsShort.${MONTH_KEYS[date.getMonth()]}`),
    day: date.getDate(),
  });
}
