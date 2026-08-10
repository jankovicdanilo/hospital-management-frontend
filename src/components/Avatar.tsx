function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

type AvatarSize = 'sm' | 'lg';

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-9 w-9 text-sm',
  lg: 'h-16 w-16 text-xl',
};

interface AvatarProps {
  name: string;
  size?: AvatarSize;
}

export default function Avatar({ name, size = 'sm' }: AvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 ${sizeClasses[size]}`}
    >
      {getInitials(name)}
    </span>
  );
}
