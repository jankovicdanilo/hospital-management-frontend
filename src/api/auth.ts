import type { LoginRequest, LoginError, User } from '../types/auth';

const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL as string;

export async function loginRequest(credentials: LoginRequest): Promise<User> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error: LoginError = await response.json();
    throw new Error(error.message);
  }

  return response.json() as Promise<User>;
}
