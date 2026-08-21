import type { BadgeColor } from '../components/Badge';
import type { AppointmentStatus } from '../types/appointment';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['Pending', 'Completed', 'Cancelled', 'Missed'];

interface StatusStyle {
  bg: string;
  border: string;
  text: string;
  dot: string;
  badge: BadgeColor;
}

export const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  Pending: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', dot: 'bg-amber-500', badge: 'amber' },
  Completed: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', dot: 'bg-green-500', badge: 'green' },
  Cancelled: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', dot: 'bg-red-500', badge: 'red' },
  Missed: { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-700', dot: 'bg-gray-500', badge: 'gray' },
};
