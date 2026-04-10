import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiFetch } from '../api'
import { LogOut, Info, Smartphone, User, Users, Copy, Check, UserPlus, Crown, DoorOpen, Shield, UserMinus } from 'lucide-react'

interface FarmMember {
  id: number
  displayName: string
  email: string
  role: string
}

interface FarmInfo {
  id: number
  name: string
  inviteCode: string | null
  createdBy: number
}

export function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const toast = useToast()
  const [farm, setFarm] = useState<FarmInfo | null>(null)
  const [members, setMembers] = useState<FarmMember[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [creatingFarm, setCreatingFarm] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<FarmMember | null>(null)
  const [confirmTransfer, setConfirmTransfer] = useState<FarmMember | null>(null)

  const isOwner = user?.farmRole === 'owner'

  const loadFarm = () => {
    if (!user?.farmId) { setFarm(null); setMembers([]); return }
    apiFetch<{ farm: FarmInfo; members: FarmMember[] }>('farm.php')
      .then(res => { setFarm(res.farm); setMembers(res.members) })
      .catch(() => {})
  }

  useEffect(() => { loadFarm() }, [user?.farmId])

  const handleCopyCode = async () => {
    if (!farm?.inviteCode) return
    await navigator.clipboard.writeText(farm.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinFarm = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      await apiFetch('farm.php?action=join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      await refreshUser()
      setJoinCode('')
      toast.success('Farm beigetreten')
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Fehler beim Beitreten')
    } finally {
      setJoining(false)
    }
  }

  const handleCreateFarm = async () => {
    setCreatingFarm(true)
    try {
      await apiFetch('farm.php?action=create', {
        method: 'POST',
        body: JSON.stringify({ name: `${user?.displayName}s Farm` }),
      })
      await refreshUser()
      toast.success('Farm erstellt')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Konnte Farm nicht erstellen')
    }
    finally { setCreatingFarm(false) }
  }

  const handleLeaveFarm = async () => {
    try {
      await apiFetch('farm.php?action=leave', { method: 'POST' })
      setConfirmLeave(false)
      setFarm(null)
      setMembers([])
      await refreshUser()
      toast.success('Farm verlassen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    }
  }

  const handleTransfer = async (targetId: number) => {
    try {
      await apiFetch('farm.php?action=transfer', {
        method: 'POST',
        body: JSON.stringify({ userId: targetId }),
      })
      setConfirmTransfer(null)
      await refreshUser()
      loadFarm()
      toast.success('Admin-Rechte übertragen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    }
  }

  const handleRemoveMember = async (targetId: number) => {
    try {
      await apiFetch('farm.php?action=remove', {
        method: 'POST',
        body: JSON.stringify({ userId: targetId }),
      })
      setConfirmRemove(null)
      loadFarm()
      toast.success('Mitglied entfernt')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    }
  }

  return (
    <div className="p-4 space-y-5" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>

      {/* Farm */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Users className="w-4 h-4" /> Farm
        </h2>

        {user?.farmId && farm ? (
          <>
            <div>
              <p className="font-semibold text-gray-800">{farm.name}</p>
              <p className="text-xs text-gray-400">{members.length} Mitglied{members.length !== 1 ? 'er' : ''}</p>
            </div>

            {/* Invite code — only visible to owner */}
            {isOwner && farm.inviteCode && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-600 mb-1.5">Einladungscode teilen:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xl font-mono font-bold text-green-700 tracking-widest text-center">
                    {farm.inviteCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 bg-green-500 text-white rounded-xl active:scale-95 transition-transform"
                    aria-label="Code kopieren"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="space-y-1">
              {members.map(m => {
                const isSelf = m.id === user.id
                return (
                  <div key={m.id} className="flex items-center gap-3 py-1.5">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      {m.role === 'owner'
                        ? <Crown className="w-4 h-4 text-amber-500" />
                        : <User className="w-4 h-4 text-green-600" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {m.displayName}{isSelf ? ' (du)' : ''}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {m.role === 'owner' ? 'Admin' : 'Mitglied'}
                    </span>
                    {/* Admin actions on other members */}
                    {isOwner && !isSelf && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => setConfirmTransfer(m)}
                          className="text-gray-300 active:text-amber-500 p-1.5 min-w-9 min-h-9 flex items-center justify-center"
                          aria-label="Zum Admin machen"
                          title="Zum Admin machen"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmRemove(m)}
                          className="text-gray-300 active:text-red-500 p-1.5 min-w-9 min-h-9 flex items-center justify-center"
                          aria-label="Entfernen"
                          title="Entfernen"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Leave farm */}
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
            >
              <DoorOpen className="w-4 h-4" />
              {isOwner && members.length === 1 ? 'Farm auflösen' : 'Farm verlassen'}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Erstelle eine Farm oder tritt einer bei, um Hühner gemeinsam zu verwalten.
            </p>

            <button
              onClick={handleCreateFarm}
              disabled={creatingFarm}
              className="w-full py-3 rounded-xl bg-green-500 text-white text-base font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              {creatingFarm ? 'Wird erstellt...' : 'Farm erstellen'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">oder</span></div>
            </div>

            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Code eingeben"
                maxLength={8}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 font-mono tracking-widest text-center uppercase"
              />
              <button
                onClick={handleJoinFarm}
                disabled={!joinCode.trim() || joining}
                className="px-4 py-3 rounded-xl bg-green-500 text-white font-semibold active:scale-95 transition-transform disabled:opacity-40"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            {joinError && <p className="text-red-500 text-sm text-center">{joinError}</p>}
          </div>
        )}
      </div>

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
          <span className="text-gray-400">{__APP_VERSION__}</span>
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

      {/* Confirm leave dialog */}
      {confirmLeave && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setConfirmLeave(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">
              {isOwner && members.length === 1 ? 'Farm auflösen?' : 'Farm verlassen?'}
            </h3>
            <p className="text-sm text-gray-500">
              {isOwner && members.length === 1
                ? 'Die Farm wird aufgelöst. Deine Hühner und Eier bleiben erhalten und sind danach nur noch für dich sichtbar.'
                : isOwner
                  ? 'Du musst zuerst die Admin-Rechte an ein anderes Mitglied übertragen.'
                  : 'Du verlässt die Farm. Alle Hühner und Eier bleiben in der Farm erhalten. Du kannst jederzeit per Einladungscode wieder beitreten.'
              }
            </p>
            {isOwner && members.length > 1 ? (
              <button
                onClick={() => setConfirmLeave(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Verstanden
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleLeaveFarm}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-transform"
                >
                  {isOwner && members.length === 1 ? 'Auflösen' : 'Verlassen'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm transfer dialog */}
      {confirmTransfer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setConfirmTransfer(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Admin-Rechte übertragen?</h3>
            <p className="text-sm text-gray-500">
              <strong>{confirmTransfer.displayName}</strong> wird neuer Admin. Du wirst zum normalen Mitglied.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTransfer(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleTransfer(confirmTransfer.id)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                Übertragen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Mitglied entfernen?</h3>
            <p className="text-sm text-gray-500">
              <strong>{confirmRemove.displayName}</strong> wird aus der Farm entfernt. Alle Hühner und Eier bleiben in der Farm erhalten.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleRemoveMember(confirmRemove.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
