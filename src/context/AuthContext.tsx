import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, setToken } from '../api'

export interface AppUser {
  id: number
  email: string
  displayName: string
}

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('chickinn_token')
    if (!token) {
      setLoading(false)
      return
    }

    apiFetch<{ user: AppUser }>('auth.php?action=me')
      .then(res => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AppUser }>(
      'auth.php?action=login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    )
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await apiFetch<{ token: string; user: AppUser }>(
      'auth.php?action=register',
      { method: 'POST', body: JSON.stringify({ email, password, displayName }) }
    )
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('auth.php?action=logout', { method: 'POST' })
    } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
