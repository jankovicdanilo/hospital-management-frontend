function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The clinic's IANA timezone, matching ClinicSettings.TimeZoneId on the backend. */
export const CLINIC_TIME_ZONE = 'Europe/Podgorica';

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
 * Converts a wall-clock date + time-of-day in `timeZone` (e.g. the clinic's business hours)
 * into the real UTC instant it represents — accounts for that zone's DST rules instead of
 * assuming the browser runs in the same timezone.
 */
function zonedWallTimeToUtc(dateIso: string, timeStr: string, timeZone: string): Date {
  const asIfUtc = new Date(`${dateIso}T${timeStr}Z`);
  const offsetMs = getTimeZoneOffsetMs(asIfUtc, timeZone);
  return new Date(asIfUtc.getTime() - offsetMs);
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

export function formatDurationLabel(duration: string): string {
  const totalMinutes = Math.round(parseDurationToMinutes(duration));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

export function minutesToDurationString(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${pad(h)}:${pad(m)}:00`;
}

/**
 * Parses a slot time string that is either a full ISO datetime or a bare "HH:mm:ss" time-of-day.
 * Bare time-of-day values are clinic business hours, so they're interpreted in the clinic's own
 * timezone rather than the browser's ambient local timezone.
 */
export function parseSlotTime(dateIso: string, timeStr: string): Date {
  if (timeStr.includes('T')) {
    return new Date(timeStr);
  }
  return zonedWallTimeToUtc(dateIso, timeStr, CLINIC_TIME_ZONE);
}

/** Formats a Date as a UTC ISO string for the backend (e.g. "2026-08-14T10:00:00Z"). */
export function toApiDateTimeString(date: Date): string {
  return date.toISOString();
}

export function formatDateIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTimeLabel(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
