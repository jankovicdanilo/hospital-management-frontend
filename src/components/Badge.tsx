import type { ReactNode } from 'react';

export type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'gray';

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
};

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
