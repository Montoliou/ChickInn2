import { useAuth } from '../context/AuthContext'
import { LogOut, Info, Smartphone, User } from 'lucide-react'

export function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <div className="p-4 space-y-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Konto</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 truncate">{user?.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-base font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Info className="w-4 h-4" /> App
        </h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Version</span>
          <span className="text-gray-400">1.0.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Plattform</span>
          <span className="text-gray-400">Web PWA</span>
        </div>
      </div>

      {/* PWA hint */}
      <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-sm text-green-700 flex gap-3">
        <Smartphone className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">Zum Homescreen hinzufügen</p>
          <p className="text-xs text-green-600">
            Safari: Teilen-Symbol, dann "Zum Home-Bildschirm" — dann läuft ChickInn wie eine native App.
          </p>
        </div>
      </div>
    </div>
  )
}
