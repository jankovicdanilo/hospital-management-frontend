function pad(n: number): string {
  return String(n).padStart(2, '0');
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

/** Parses a slot time string that is either a full ISO datetime or a bare "HH:mm:ss" time-of-day. */
export function parseSlotTime(dateIso: string, timeStr: string): Date {
  if (timeStr.includes('T')) {
    return new Date(timeStr);
  }
  return new Date(`${dateIso}T${timeStr}`);
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
