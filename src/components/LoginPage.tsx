import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch, setToken } from '../api'
import type { AppUser } from '../context/AuthContext'
import { Egg, UserPlus, LogIn, KeyRound, ArrowLeft, Mail, ShieldCheck } from 'lucide-react'

type Mode = 'login' | 'register' | 'forgot' | 'reset-code'

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Anmeldung')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, displayName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Registrierung')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await apiFetch<{ message: string; emailSent?: boolean }>('auth.php?action=reset-request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      // The server reports emailSent: false when mail() was rejected. Without
      // this check the screen claimed success even though no code ever arrived.
      if (res.emailSent === false) {
        setError('Der Code konnte nicht per E-Mail verschickt werden. Bitte wende dich an den Farm-Admin.')
        return
      }
      setMessage('Code wurde gesendet (prüfe dein Postfach).')
      setMode('reset-code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch<{ token: string; user: AppUser }>('auth.php?action=reset-confirm', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      })
      setToken(res.token)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 p-6 bg-linear-to-b from-green-50 via-white to-green-50/30">
      {/* Logo */}
      <div className="text-center">
        <div className="w-20 h-20 bg-linear-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
          <Egg className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">ChickInn</h1>
        <p className="text-gray-500 mt-1.5 text-sm">Deine Hühner- und Eier-Verwaltung</p>
      </div>

      {/* Login Form */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="E-Mail" required autoComplete="email"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Passwort" required minLength={6} autoComplete="current-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl px-4 py-3.5 text-base font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm">
            <LogIn className="w-5 h-5" /> {loading ? 'Anmelden...' : 'Anmelden'}
          </button>

          <button type="button" onClick={() => switchMode('forgot')}
            className="w-full text-sm text-gray-400 py-2">
            Passwort vergessen?
          </button>
        </form>
      )}

      {/* Register Form */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="w-full max-w-xs space-y-3">
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder="Dein Name" required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="E-Mail" required autoComplete="email"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Passwort (min. 6 Zeichen)" required minLength={6} autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl px-4 py-3.5 text-base font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm">
            <UserPlus className="w-5 h-5" /> {loading ? 'Wird erstellt...' : 'Registrieren'}
          </button>
        </form>
      )}

      {/* Forgot Password */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgot} className="w-full max-w-xs space-y-3">
          <div className="text-center mb-2">
            <Mail className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Gib deine E-Mail ein. Du bekommst einen 6-stelligen Code.</p>
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="E-Mail" required autoComplete="email"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl px-4 py-3.5 text-base font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm">
            <KeyRound className="w-5 h-5" /> {loading ? 'Sende...' : 'Code anfordern'}
          </button>

          <button type="button" onClick={() => switchMode('login')}
            className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 py-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Login
          </button>
        </form>
      )}

      {/* Enter Reset Code */}
      {mode === 'reset-code' && (
        <form onSubmit={handleResetConfirm} className="w-full max-w-xs space-y-3">
          <div className="text-center mb-2">
            <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Gib den Code aus der E-Mail und dein neues Passwort ein.</p>
            {message && <p className="text-green-600 text-sm mt-1">{message}</p>}
          </div>
          <input type="text" value={code} onChange={e => setCode(e.target.value)}
            placeholder="6-stelliger Code" required maxLength={6} inputMode="numeric" pattern="[0-9]{6}"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white text-center tracking-[0.5em] font-mono transition-shadow" />
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="Neues Passwort (min. 6 Zeichen)" required minLength={6} autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white transition-shadow" />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl px-4 py-3.5 text-base font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm">
            <ShieldCheck className="w-5 h-5" /> {loading ? 'Setze zurück...' : 'Passwort zurücksetzen'}
          </button>

          <button type="button" onClick={() => switchMode('login')}
            className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 py-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Login
          </button>
        </form>
      )}

      {/* Toggle Login/Register */}
      {(mode === 'login' || mode === 'register') && (
        <button
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="text-sm text-green-600 font-medium py-2"
        >
          {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden'}
        </button>
      )}

      <p className="text-xs text-gray-400 text-center">
        Deine Daten werden sicher auf dem Server gespeichert<br />und sind nur für dich sichtbar.
      </p>
    </div>
  )
}
