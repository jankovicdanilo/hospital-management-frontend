import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { VersionInfo } from '../types/version';
import { getVersion } from '../api/version';

const VersionContext = createContext<VersionInfo | null>(null);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null));
  }, []);

  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
}

export function useVersion(): VersionInfo | null {
  return useContext(VersionContext);
}
