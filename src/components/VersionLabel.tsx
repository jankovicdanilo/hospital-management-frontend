import { useVersion } from '../context/VersionContext';
import { formatVersion } from '../types/version';

interface VersionLabelProps {
  className?: string;
  prefix?: string;
}

export default function VersionLabel({ className = 'text-gray-400', prefix = '' }: VersionLabelProps) {
  const version = useVersion();

  if (!version) {
    return null;
  }

  return (
    <span className={className}>
      {prefix}
      {formatVersion(version)}
    </span>
  );
}
