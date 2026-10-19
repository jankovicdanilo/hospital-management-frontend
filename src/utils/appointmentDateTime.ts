import type { DayOfWeek, DoctorScheduleResponseDto } from '../types/doctorSchedule';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The clinic's IANA timezone, from config — never hardcoded elsewhere. */
export const CLINIC_TIME_ZONE = import.meta.env.VITE_CLINIC_TIME_ZONE as string;

const WEEK_DAY_NAMES: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEK_ORDER: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** How far `timeZone`'s local wall clock is ahead of UTC at the given instant, in ms. */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - date.getTime();
}

/**
 * Converts a wall-clock date + time-of-day in `timeZone` into the real UTC instant it
 * represents — accounts for that zone's DST rules instead of assuming the browser runs in
 * the same timezone.
 */
function zonedWallTimeToUtc(dateIso: string, timeStr: string, timeZone: string): Date {
  const asIfUtc = new Date(`${dateIso}T${timeStr}Z`);
  const offsetMs = getTimeZoneOffsetMs(asIfUtc, timeZone);
  return new Date(asIfUtc.getTime() - offsetMs);
}

/** The clinic's UTC offset in minutes on the date of the given instant (e.g. 120 in summer, 60 in winter for Europe/Podgorica). */
export function clinicUtcOffsetMinutes(date: Date): number {
  return Math.round(getTimeZoneOffsetMs(date, CLINIC_TIME_ZONE) / 60_000);
}

/** Formats a real instant as its "HH:mm:ss" wall-clock time in `timeZone`. */
export function formatTimeOfDayInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('hour')}:${get('minute')}:${get('second')}`;
}

export function parseDurationToMinutes(duration: string): number {
  const [h = '0', m = '0', s = '0'] = duration.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

export function formatDurationParts(duration: string): { hours: number; minutes: number } {
  const totalMinutes = Math.round(parseDurationToMinutes(duration));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function minutesToDurationString(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${pad(h)}:${pad(m)}:00`;
}

/** Formats a Date as a UTC ISO string for the backend (e.g. "2026-08-14T10:00:00Z"). */
export function toApiDateTimeString(date: Date): string {
  return date.toISOString();
}

export function formatDateIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses a "yyyy-MM-dd" calendar date string into a local midnight `Date` (the inverse of `formatDateIso`). */
export function parseDateIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Formats a UTC instant as its "yyyy-MM-dd" UTC calendar day — the format the API's date params use. */
export function formatUtcDateIso(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The clinic-local calendar day (yyyy-MM-dd) that a real instant falls on. */
export function clinicLocalDateIso(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: CLINIC_TIME_ZONE });
}

/** Minutes since clinic-local midnight for a real instant — for positioning appointments on a local time grid. */
export function clinicLocalMinutesOfDay(date: Date): number {
  const [h, m] = formatTimeOfDayInZone(date, CLINIC_TIME_ZONE).split(':').map(Number);
  return h * 60 + m;
}

/** The real UTC instant marking the start of `dateIso`'s clinic-local day. */
export function clinicLocalDayStartUtc(dateIso: string): Date {
  return zonedWallTimeToUtc(dateIso, '00:00:00', CLINIC_TIME_ZONE);
}

/**
 * The UTC calendar day(s) (1 or 2) that a clinic-local calendar day overlaps. A local day's
 * boundaries rarely line up with UTC midnight, so most of a local day falls on one UTC day
 * with a sliver spilling into the neighboring one.
 */
export function utcDaysForLocalDate(dateIso: string): string[] {
  const start = clinicLocalDayStartUtc(dateIso);
  const nextDateIso = formatDateIso(addDays(parseDateIso(dateIso), 1));
  const end = clinicLocalDayStartUtc(nextDateIso);
  const startDayIso = formatUtcDateIso(start);
  const endDayIso = formatUtcDateIso(new Date(end.getTime() - 1));
  return startDayIso === endDayIso ? [startDayIso] : [startDayIso, endDayIso];
}

/** Last 12 months up to today, counted back from today's UTC date. */
export function defaultStatisticsDateRange(): { from: string; to: string } {
  const todayIso = formatUtcDateIso(new Date());
  const [y, m, d] = todayIso.split('-').map(Number);
  const oneYearAgo = new Date(Date.UTC(y - 1, m - 1, d));
  return { from: formatUtcDateIso(oneYearAgo), to: todayIso };
}

/** The UTC weekday name for a "yyyy-MM-dd" UTC calendar date string. */
function utcWeekdayOfIsoDate(utcDateIso: string): DayOfWeek {
  const [y, m, d] = utcDateIso.split('-').map(Number);
  return WEEK_DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export interface ScheduleWindow {
  start: Date;
  end: Date;
}

/**
 * The real time window(s) of a doctor's UTC-based weekly schedule that fall within a
 * clinic-local calendar day. Since a local day can straddle two UTC days, this checks both
 * UTC days the local day overlaps and clips each matching schedule window to the local day's
 * bounds — a local date is bookable only if this returns at least one window.
 */
export function scheduleWindowsForLocalDate(
  schedules: DoctorScheduleResponseDto[],
  localDateIso: string,
): ScheduleWindow[] {
  const localStart = clinicLocalDayStartUtc(localDateIso);
  const localEnd = clinicLocalDayStartUtc(formatDateIso(addDays(parseDateIso(localDateIso), 1)));
  const windows: ScheduleWindow[] = [];

  for (const utcDateIso of utcDaysForLocalDate(localDateIso)) {
    const schedule = schedules.find((s) => s.dayOfWeek === utcWeekdayOfIsoDate(utcDateIso));
    if (!schedule) {
      continue;
    }

    const [y, m, d] = utcDateIso.split('-').map(Number);
    const utcDayStartMs = Date.UTC(y, m - 1, d);
    const start = new Date(Math.max(utcDayStartMs + schedule.startHour * 3_600_000, localStart.getTime()));
    const end = new Date(Math.min(utcDayStartMs + schedule.endHour * 3_600_000, localEnd.getTime()));

    if (start.getTime() < end.getTime()) {
      windows.push({ start, end });
    }
  }

  return windows;
}

/**
 * Which clinic-local weekdays a doctor works, derived from their UTC schedule. Checked
 * against one reference week (the current week) rather than the schedule's raw UTC weekday
 * names, since a UTC day's working hours can spill into the neighboring local weekday.
 */
export function workingLocalWeekdays(schedules: DoctorScheduleResponseDto[]): DayOfWeek[] {
  const monday = getMonday(new Date());
  return WEEK_ORDER.filter((_, i) => scheduleWindowsForLocalDate(schedules, formatDateIso(addDays(monday, i))).length > 0);
}

/** The nearest UTC calendar date (today or later) that falls on the given UTC weekday. */
function nextUtcDateIsoForWeekday(weekday: DayOfWeek): string {
  const targetIdx = WEEK_DAY_NAMES.indexOf(weekday);
  const now = new Date();
  const diff = (targetIdx - now.getUTCDay() + 7) % 7;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return formatUtcDateIso(d);
}

/** The nearest clinic-local calendar date (today or later) that falls on the given local weekday. */
function nextLocalDateIsoForWeekday(weekday: DayOfWeek): string {
  const targetIdx = WEEK_DAY_NAMES.indexOf(weekday);
  const todayLocalIso = clinicLocalDateIso(new Date());
  const diff = (targetIdx - parseDateIso(todayLocalIso).getDay() + 7) % 7;
  return formatDateIso(addDays(parseDateIso(todayLocalIso), diff));
}

export interface UtcSchedule {
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
}

export interface LocalSchedule {
  day: DayOfWeek;
  startHour: number;
  endHour: number;
}

/**
 * Converts a doctor schedule's UTC day/hours (what the API stores) to its clinic-local
 * day/hour-of-day equivalent (what the editor shows), using the clinic's offset on the
 * nearest upcoming occurrence of the UTC weekday for DST accuracy. The end hour is derived
 * from the same shift as the start hour rather than converted independently, since both fall
 * within the same UTC day and (outside the rare instant a DST change itself occurs) share the
 * same offset.
 */
export function utcScheduleToLocal(schedule: UtcSchedule): LocalSchedule {
  const utcDateIso = nextUtcDateIsoForWeekday(schedule.dayOfWeek);
  const [y, m, d] = utcDateIso.split('-').map(Number);
  const startInstant = new Date(Date.UTC(y, m - 1, d) + schedule.startHour * 3_600_000);

  const localDateIso = clinicLocalDateIso(startInstant);
  const localDayStart = clinicLocalDayStartUtc(localDateIso);
  const startHour = Math.round((startInstant.getTime() - localDayStart.getTime()) / 3_600_000);
  const endHour = startHour + (schedule.endHour - schedule.startHour);
  const day = WEEK_DAY_NAMES[parseDateIso(localDateIso).getDay()];

  return { day, startHour, endHour };
}

/**
 * Converts a doctor schedule's clinic-local day/hours (what the editor collects) to the UTC
 * day/hours the API stores, using the clinic's offset on the nearest upcoming occurrence of
 * that local weekday. Returns null if the local window doesn't fit inside a single UTC
 * weekday once converted — including landing on a UTC weekend, which schedules can't use —
 * since the API can only represent a schedule as fixed hours inside one UTC day.
 */
export function localScheduleToUtc(local: LocalSchedule): UtcSchedule | null {
  const localDateIso = nextLocalDateIsoForWeekday(local.day);
  const localDayStart = clinicLocalDayStartUtc(localDateIso).getTime();
  const startInstant = localDayStart + local.startHour * 3_600_000;
  const endInstant = localDayStart + local.endHour * 3_600_000;

  const utcStartDateIso = formatUtcDateIso(new Date(startInstant));
  const utcEndDateIso = formatUtcDateIso(new Date(endInstant - 1));
  if (utcStartDateIso !== utcEndDateIso) {
    return null;
  }

  const dayOfWeek = utcWeekdayOfIsoDate(utcStartDateIso);
  if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
    return null;
  }

  const [y, m, d] = utcStartDateIso.split('-').map(Number);
  const utcDayStart = Date.UTC(y, m - 1, d);
  const startHour = Math.round((startInstant - utcDayStart) / 3_600_000);
  const endHour = Math.round((endInstant - utcDayStart) / 3_600_000);

  return { dayOfWeek, startHour, endHour };
}
