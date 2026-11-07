import type { RegisterUserRequest, UpdateUserRequest, UserDto } from '../types/user';
import { authHeaders, throwApiError } from './apiErrors';

const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL as string;

export async function getUsers(token: string): Promise<UserDto[]> {
  const response = await fetch(`${BASE_URL}/api/auth`, { headers: authHeaders(token) });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<UserDto[]>;
}

// The response carries the new user's own token, which the app must ignore and keep the
// admin's session — so the caller reloads the user list afterwards instead of using this.
export async function registerUser(data: RegisterUserRequest, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

// The caller reloads the user list afterwards rather than relying on this response's fields.
export async function updateUser(data: UpdateUserRequest, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/auth`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

export async function deleteUser(id: number, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/auth/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}
