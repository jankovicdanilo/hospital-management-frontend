import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role, User } from '../types/auth';
import { setUnauthorizedHandler } from '../api/apiErrors';

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_STORAGE_KEY = 'hospital_session';
const ROLES: Role[] = ['Admin', 'Manager', 'Doctor'];

function isUser(data: unknown): data is User {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.username === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string' &&
    ROLES.includes(candidate.role as Role) &&
    (typeof candidate.doctorId === 'number' || candidate.doctorId === null) &&
    typeof candidate.token === 'string' &&
    candidate.token.length > 0
  );
}

function isTokenExpired(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return true;
  }
  try {
    const unpadded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const base64 = unpadded.padEnd(unpadded.length + ((4 - (unpadded.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return true;
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function readStoredUser(): User | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (isUser(parsed) && !isTokenExpired(parsed.token)) {
      return parsed;
    }
  } catch {
    // Stored value is not valid JSON — treat as tampered below.
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  function login(userData: User) {
    setUser(userData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
  }

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  // A 401 means the token is no longer valid — logging out here (instead of in every
  // page's catch block) lets AuthLayout's existing `!user` check redirect to login.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
