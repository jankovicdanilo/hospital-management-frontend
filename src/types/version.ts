export interface VersionInfo {
  service: string;
  version: string;
  build: string;
}

const NUMERIC_VERSION = /^\d+(\.\d+)*$/;

export function formatVersion({ version, build }: VersionInfo): string {
  const label = NUMERIC_VERSION.test(version) ? `v${version}` : version;
  return `${label} (${build})`;
}
