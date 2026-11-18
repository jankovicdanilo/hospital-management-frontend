import type { VersionInfo } from '../types/version';
import { throwApiError } from './apiErrors';

const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL as string;

export async function getVersion(): Promise<VersionInfo> {
  const response = await fetch(`${BASE_URL}/version`);

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<VersionInfo>;
}
