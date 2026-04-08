import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Egg, UserPlus, LogIn } from 'lucide-react'

type Mode = 'login' | 'register'

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, displayName)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Anmeldung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Egg className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">ChickInn</h1>
        <p className="text-gray-500 mt-2">Deine Hühner- und Eier-Verwaltung</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        {mode === 'register' && (
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Dein Name"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 bg-white"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-Mail"
          required
          autoComplete="email"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 bg-white"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Passwort"
          required
          minLength={6}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 bg-white"
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl px-4 py-3 text-base font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          {mode === 'register'
            ? <><UserPlus className="w-5 h-5" /> {loading ? 'Wird erstellt...' : 'Registrieren'}</>
            : <><LogIn className="w-5 h-5" /> {loading ? 'Anmelden...' : 'Anmelden'}</>
          }
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
        className="text-sm text-green-600 font-medium py-2"
      >
        {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Deine Daten werden sicher auf dem Server gespeichert<br />und sind nur für dich sichtbar.
      </p>
    </div>
  )
}
