import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ApiError, AuthResponse } from '../types/auth'

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL

interface AuthContextValue {
  user: AuthResponse | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      const apiError = data as ApiError
      throw new Error(apiError.message || 'Login failed')
    }

    const auth = data as AuthResponse
    setUser(auth)
    setToken(auth.token)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
