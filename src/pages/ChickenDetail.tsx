import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { PhotoPicker } from '../components/PhotoPicker'
import { ChevronLeft, Egg, Pill, Plus, Pencil, Check, Trash2, Camera, CalendarDays, Minus, HeartPulse } from 'lucide-react'
import { apiFetch } from '../api'

type Tab = 'eier' | 'gesundheit' | 'medikation'

const HEALTH_CHECKS = [
  { key: 'eating', label: 'Frisst normal', emoji: '🌾' },
  { key: 'drinking', label: 'Trinkt normal', emoji: '💧' },
  { key: 'active', label: 'Aktiv & munter', emoji: '🐔' },
  { key: 'feathers', label: 'Gefieder in Ordnung', emoji: '🪶' },
  { key: 'droppings', label: 'Kot normal', emoji: '💩' },
  { key: 'eyes', label: 'Augen klar', emoji: '👁️' },
  { key: 'comb', label: 'Kamm rot & gesund', emoji: '❤️' },
  { key: 'laying', label: 'Legt regelmäßig', emoji: '🥚' },
] as const

interface HealthLog {
  id: number
  chickenId: number
  logDate: string
  checks: Record<string, boolean>
  notes: string | null
}

export function ChickenDetail() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()
  const { chickens, updateChicken, deleteChicken } = useChickens()
  const { eggs, addEgg, deleteEgg } = useEggs(numericId)
  const [activeTab, setActiveTab] = useState<Tab>('eier')
  const [uploading, setUploading] = useState(false)
  const [uploadingEggPhoto, setUploadingEggPhoto] = useState(false)
  const [eggToDelete, setEggToDelete] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBreed, setEditBreed] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEggModal, setShowEggModal] = useState(false)
  const [eggDate, setEggDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [eggCount, setEggCount] = useState(1)
  const [addingEggs, setAddingEggs] = useState(false)
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([])
  const [todayChecks, setTodayChecks] = useState<Record<string, boolean>>({})
  const [healthNotes, setHealthNotes] = useState('')
  const [savingHealth, setSavingHealth] = useState(false)

  const loadHealthLogs = useCallback(async () => {
    try {
      const logs = await apiFetch<HealthLog[]>(`health.php?chickenId=${numericId}`)
      setHealthLogs(logs)
      const today = new Date().toISOString().slice(0, 10)
      const todayLog = logs.find(l => l.logDate === today)
      if (todayLog) {
        setTodayChecks(todayLog.checks)
        setHealthNotes(todayLog.notes ?? '')
      }
    } catch { /* ignore */ }
  }, [numericId])

  useEffect(() => { loadHealthLogs() }, [loadHealthLogs])

  const saveHealthLog = async (checks: Record<string, boolean>, notes: string) => {
    setSavingHealth(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await apiFetch('health.php', {
        method: 'POST',
        body: JSON.stringify({ chickenId: numericId, logDate: today, checks, notes: notes || null }),
      })
      await loadHealthLogs()
    } catch (err) {
      console.error('Health save failed:', err)
    } finally {
      setSavingHealth(false)
    }
  }

  const toggleCheck = (key: string) => {
    const updated = { ...todayChecks, [key]: !todayChecks[key] }
    setTodayChecks(updated)
    saveHealthLog(updated, healthNotes)
  }

  const chicken = chickens.find(c => c.id === numericId)
  if (!chicken) return (
    <div className="p-4 text-center text-gray-400 pt-20">Huhn nicht gefunden.</div>
  )

  const startEditing = () => {
    setEditName(chicken.name)
    setEditBreed(chicken.breed ?? '')
    setEditNotes(chicken.notes ?? '')
    setEditing(true)
  }

  const saveEdits = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateChicken(chicken.id, {
        name: editName.trim(),
        breed: editBreed.trim() || null,
        notes: editNotes.trim() || null,
      })
      setEditing(false)
    } catch (err) {
      console.error('Update failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await deleteChicken(chicken.id)
    navigate(-1)
  }

  const handleAddEggs = async () => {
    setAddingEggs(true)
    try {
      const date = new Date(eggDate)
      for (let i = 0; i < eggCount; i++) {
        // Spread eggs across the day (8:00 + i minutes) so they sort nicely
        const ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, i).getTime()
        await addEgg(chicken.id, ts)
      }
      setShowEggModal(false)
      setEggCount(1)
      setEggDate(new Date().toISOString().slice(0, 10))
    } catch (err) {
      console.error('Failed to add eggs:', err)
    } finally {
      setAddingEggs(false)
    }
  }

  const handlePhotoSelect = async (file: File) => {
    setUploading(true)
    try {
      const photoUrl = await uploadPhoto(file)
      await updateChicken(chicken.id, { photoUrl })
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleEggPhotoSelect = async (file: File) => {
    setUploadingEggPhoto(true)
    try {
      const eggPhotoUrl = await uploadPhoto(file)
      await updateChicken(chicken.id, { eggPhotoUrl })
    } catch (err) {
      console.error('Egg photo upload failed:', err)
    } finally {
      setUploadingEggPhoto(false)
    }
  }

  const tabs: { key: Tab; label: string; Icon: typeof Egg }[] = [
    { key: 'eier', label: 'Eier', Icon: Egg },
    { key: 'gesundheit', label: 'Gesundheit', Icon: HeartPulse },
    { key: 'medikation', label: 'Medikation', Icon: Pill },
  ]

  return (
    <div className="flex flex-col min-h-svh" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => { if (editing) setEditing(false); else navigate(-1) }}
          className="text-green-600 p-1 min-w-11 min-h-11 flex items-center justify-center"
          aria-label="Zurück"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Photo (tappable to change via PhotoPicker) */}
        {uploading ? (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <PhotoPicker
            currentUrl={chicken.photoUrl}
            onSelect={handlePhotoSelect}
            size="sm"
          />
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="font-bold text-gray-900 text-lg w-full bg-gray-50 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-green-400"
              autoFocus
            />
          ) : (
            <>
              <h1 className="font-bold text-gray-900 text-lg truncate">{chicken.name}</h1>
              {chicken.breed && <p className="text-xs text-gray-400 truncate">{chicken.breed}</p>}
            </>
          )}
        </div>

        {editing ? (
          <button
            onClick={saveEdits}
            disabled={saving || !editName.trim()}
            className="bg-green-500 text-white p-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-40 shrink-0 shadow-sm"
            aria-label="Speichern"
          >
            <Check className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={startEditing}
              className="text-gray-400 p-2 min-w-11 min-h-11 flex items-center justify-center active:text-green-600"
              aria-label="Bearbeiten"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEggDate(new Date().toISOString().slice(0, 10)); setEggCount(1); setShowEggModal(true) }}
              className="bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-full active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Ei
            </button>
          </div>
        )}
      </div>

      {/* Edit form (breed, notes, delete) */}
      {editing && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Rasse</label>
            <input
              value={editBreed}
              onChange={e => setEditBreed(e.target.value)}
              placeholder="z.B. Sussex, Araucana..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notizen</label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Besonderheiten, Charakter..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Ei-Referenzfoto</label>
            <p className="text-xs text-gray-400 mb-2">Zeigt wie das Ei dieses Huhns aussieht — hilft bei der Zuordnung.</p>
            <div className="flex items-center gap-3">
              {uploadingEggPhoto ? (
                <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <PhotoPicker
                  currentUrl={chicken.eggPhotoUrl}
                  onSelect={handleEggPhotoSelect}
                  size="sm"
                  placeholder={<Egg className="w-5 h-5 text-amber-300" />}
                />
              )}
              {chicken.eggPhotoUrl && (
                <span className="text-xs text-green-600">Ei-Foto hinterlegt</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <Trash2 className="w-4 h-4" /> Huhn löschen
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Huhn löschen?</h3>
            <p className="text-sm text-gray-500">
              <strong>{chicken.name}</strong> und alle zugehörigen Eier werden unwiderruflich gelöscht.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 min-h-12 ${
              activeTab === t.key
                ? 'text-green-600 border-b-2 border-green-500'
                : 'text-gray-400'
            }`}
          >
            <t.Icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {activeTab === 'eier' && (
          <div className="space-y-3">
            {/* Egg reference photo card */}
            {chicken.eggPhotoUrl ? (
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 flex items-center gap-3">
                <img src={chicken.eggPhotoUrl} alt="Ei-Referenz" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-800">Ei von {chicken.name}</p>
                  <p className="text-xs text-amber-600">Referenzfoto zur Zuordnung</p>
                </div>
              </div>
            ) : !editing ? (
              <button
                onClick={startEditing}
                className="w-full bg-amber-50 rounded-xl border border-dashed border-amber-200 p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Camera className="w-6 h-6 text-amber-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-700">Ei-Foto hinterlegen</p>
                  <p className="text-xs text-amber-500">Hilft bei der Zuordnung der Eier</p>
                </div>
              </button>
            ) : null}

            {eggs.length === 0
              ? <div className="text-center text-gray-400 pt-8">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Egg className="w-7 h-7 text-amber-300" />
                  </div>
                  <p className="text-sm">Noch keine Eier erfasst.</p>
                </div>
              : (
              <div className="space-y-2">
                {eggs.map(egg => (
                  <div key={egg.id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3 overflow-hidden">
                    <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                      <Egg className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">
                      {new Date(egg.laidAt).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {eggToDelete === egg.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEggToDelete(null)}
                          className="text-gray-400 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 active:scale-95 transition-transform"
                        >
                          Nein
                        </button>
                        <button
                          onClick={() => { deleteEgg(egg.id); setEggToDelete(null) }}
                          className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-3 h-3" /> Löschen
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEggToDelete(egg.id)}
                        className="text-gray-300 active:text-red-400 p-2 min-w-11 min-h-11 flex items-center justify-center"
                        aria-label="Ei löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gesundheit' && (
          <div className="space-y-4">
            {/* Today's checks */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Heute ({new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })})
              </h3>
              <div className="space-y-1">
                {HEALTH_CHECKS.map(check => (
                  <button
                    key={check.key}
                    onClick={() => toggleCheck(check.key)}
                    disabled={savingHealth}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left active:scale-[0.99] ${
                      todayChecks[check.key]
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                      todayChecks[check.key]
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {todayChecks[check.key] && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm mr-1">{check.emoji}</span>
                    <span className={`text-sm flex-1 ${todayChecks[check.key] ? 'text-green-700' : 'text-gray-600'}`}>
                      {check.label}
                    </span>
                  </button>
                ))}
              </div>
              <div>
                <input
                  value={healthNotes}
                  onChange={e => setHealthNotes(e.target.value)}
                  onBlur={() => saveHealthLog(todayChecks, healthNotes)}
                  placeholder="Notiz zum heutigen Zustand..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
            </div>

            {/* Recent health history */}
            {healthLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">Verlauf (letzte 30 Tage)</h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {healthLogs.slice(0, 14).map(log => {
                    const checkedCount = Object.values(log.checks).filter(Boolean).length
                    const total = HEALTH_CHECKS.length
                    const pct = Math.round((checkedCount / total) * 100)
                    return (
                      <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          pct >= 80 ? 'bg-green-100 text-green-600' :
                          pct >= 50 ? 'bg-amber-100 text-amber-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {pct}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">
                            {new Date(log.logDate + 'T00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </p>
                          {log.notes && <p className="text-xs text-gray-400 truncate">{log.notes}</p>}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{checkedCount}/{total}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medikation' && (
          <div className="text-center text-gray-400 pt-12">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Pill className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm">Medikations-Erfassung kommt bald</p>
          </div>
        )}
      </div>

      {/* Add egg modal */}
      {showEggModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setShowEggModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl safe-area-bottom" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Egg className="w-5 h-5 text-amber-400" /> Ei eintragen
            </h3>

            {/* Date picker */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />Datum
              </label>
              <input
                type="date"
                value={eggDate}
                onChange={e => setEggDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
              />
            </div>

            {/* Count */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Anzahl</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEggCount(c => Math.max(1, c - 1))}
                  disabled={eggCount <= 1}
                  className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-transform disabled:opacity-30"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-3xl font-bold text-gray-900 w-12 text-center">{eggCount}</span>
                <button
                  onClick={() => setEggCount(c => c + 1)}
                  className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowEggModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddEggs}
                disabled={addingEggs}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {addingEggs ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{eggCount > 1 ? `${eggCount} Eier` : '1 Ei'} eintragen</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
