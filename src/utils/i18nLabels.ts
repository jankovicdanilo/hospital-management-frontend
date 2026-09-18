import type { TFunction } from 'i18next';
import type { AppointmentStatus } from '../types/appointment';
import type { DayOfWeek } from '../types/doctorSchedule';

export function translateStatus(t: TFunction, status: AppointmentStatus): string {
  return t(`status.${status.toLowerCase()}`);
}

export function translateDayOfWeek(t: TFunction, day: DayOfWeek): string {
  return t(`days.${day.toLowerCase()}`);
}
