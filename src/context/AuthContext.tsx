import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, setToken } from '../api'

export interface AppUser {
  id: number
  email: string
  displayName: string
  farmId?: number | null
  farmName?: string | null
  farmRole?: string | null
}

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(raw: Record<string, unknown>): AppUser {
  return {
    id: raw.id as number,
    email: raw.email as string,
    displayName: raw.displayName as string,
    farmId: (raw.farmId as number) ?? null,
    farmName: (raw.farmName as string) ?? null,
    farmRole: (raw.farmRole as string) ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: Record<string, unknown> }>('auth.php?action=me')
      setUser(mapUser(res.user))
    } catch {
      setToken(null)
      setUser(null)
    }
  }, [])

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('chickinn_token')
    if (!token) {
      setLoading(false)
      return
    }
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: Record<string, unknown> }>(
      'auth.php?action=login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    )
    setToken(res.token)
    setUser(mapUser(res.user))
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await apiFetch<{ token: string; user: Record<string, unknown> }>(
      'auth.php?action=register',
      { method: 'POST', body: JSON.stringify({ email, password, displayName }) }
    )
    setToken(res.token)
    setUser(mapUser(res.user))
  }, [refreshUser])

  const logout = useCallback(async () => {
    try {
      await apiFetch('auth.php?action=logout', { method: 'POST' })
    } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
