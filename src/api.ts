const API_BASE = import.meta.env.PROD
  ? '/chickinn/api'
  : 'http://localhost:8080/api'

function getToken(): string | null {
  return localStorage.getItem('chickinn_token')
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('chickinn_token', token)
  } else {
    localStorage.removeItem('chickinn_token')
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return data as T
}
