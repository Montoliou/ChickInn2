import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Camera, Check, ChevronLeft, Egg, Feather, HeartPulse, Minus, Pencil, Pill, Plus, Skull, Trash2 } from 'lucide-react'
import { apiFetch } from '../api'
import { PhotoPicker } from '../components/PhotoPicker'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { useMedications } from '../hooks/useMedications'
import { useMoultPeriods } from '../hooks/useMoultPeriods'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import type { Medication, MoultPeriod } from '../types'
import { dateInputToTimestamp, formatDateInput, formatDateLabel, timestampToDateInput } from '../utils/date'

type Tab = 'eier' | 'gesundheit' | 'medikation'

const SYMPTOMS = [
  { key: 'not_eating', label: 'Frisst nicht' },
  { key: 'not_drinking', label: 'Trinkt nicht' },
  { key: 'lethargic', label: 'Apathisch' },
  { key: 'feather_loss', label: 'Federverlust' },
  { key: 'diarrhea', label: 'Durchfall' },
  { key: 'soft_egg', label: 'Weiches Ei' },
  { key: 'wind_egg', label: 'Windei' },
  { key: 'blood_egg', label: 'Blut im Ei' },
  { key: 'sneezing', label: 'Niesen/Atemgeräusche' },
  { key: 'limping', label: 'Humpelt' },
  { key: 'pale_comb', label: 'Blasser Kamm' },
  { key: 'swollen_eyes', label: 'Augen geschwollen' },
] as const

interface HealthLog {
  id: number
  chickenId: number
  logDate: string
  checks: Record<string, boolean>
  notes: string | null
}

interface MedicationFormState {
  name: string
  startDate: string
  endDate: string
  notes: string
}

interface MoultFormState {
  startDate: string
  endDate: string
  notes: string
}

function createMedicationForm(): MedicationFormState {
  return {
    name: '',
    startDate: formatDateInput(new Date()),
    endDate: '',
    notes: '',
  }
}

function createMoultForm(): MoultFormState {
  return {
    startDate: formatDateInput(new Date()),
    endDate: '',
    notes: '',
  }
}

function formatPeriodLabel(startDate: number, endDate: number | null) {
  return `${formatDateLabel(startDate)} - ${endDate === null ? 'Läuft' : formatDateLabel(endDate)}`
}

export function ChickenDetail() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()
  const { chickens, updateChicken, deleteChicken } = useChickens()
  const { eggs, addEgg, deleteEgg } = useEggs(numericId)
  const { medications, loading: medicationsLoading, addMedication, updateMedication, deleteMedication } = useMedications(numericId)
  const {
    moultPeriods,
    loading: moultPeriodsLoading,
    addMoultPeriod,
    updateMoultPeriod,
    deleteMoultPeriod,
  } = useMoultPeriods(numericId)
  const [activeTab, setActiveTab] = useState<Tab>('eier')
  const [uploading, setUploading] = useState(false)
  const [uploadingEggPhoto, setUploadingEggPhoto] = useState(false)
  const [eggToDelete, setEggToDelete] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBreed, setEditBreed] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editHatchedAt, setEditHatchedAt] = useState('')
  const [editDiedAt, setEditDiedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEggModal, setShowEggModal] = useState(false)
  const [eggDate, setEggDate] = useState(() => formatDateInput(new Date()))
  const [eggCount, setEggCount] = useState(1)
  const [addingEggs, setAddingEggs] = useState(false)
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([])
  const [todayChecks, setTodayChecks] = useState<Record<string, boolean>>({})
  const [healthNotes, setHealthNotes] = useState('')
  const [savingHealth, setSavingHealth] = useState(false)
  const [showMedicationModal, setShowMedicationModal] = useState(false)
  const [editingMedicationId, setEditingMedicationId] = useState<number | null>(null)
  const [medicationForm, setMedicationForm] = useState<MedicationFormState>(() => createMedicationForm())
  const [medicationError, setMedicationError] = useState('')
  const [savingMedication, setSavingMedication] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(null)
  const [showMoultModal, setShowMoultModal] = useState(false)
  const [editingMoultId, setEditingMoultId] = useState<number | null>(null)
  const [moultForm, setMoultForm] = useState<MoultFormState>(() => createMoultForm())
  const [moultError, setMoultError] = useState('')
  const [savingMoult, setSavingMoult] = useState(false)
  const [moultToDelete, setMoultToDelete] = useState<number | null>(null)

  const todayDate = formatDateInput(new Date())

  const loadHealthLogs = useCallback(async () => {
    try {
      const logs = await apiFetch<HealthLog[]>(`health.php?chickenId=${numericId}`)
      setHealthLogs(logs)
      const todayLog = logs.find(log => log.logDate === todayDate)
      if (todayLog) {
        setTodayChecks(todayLog.checks)
        setHealthNotes(todayLog.notes ?? '')
      } else {
        setTodayChecks({})
        setHealthNotes('')
      }
    } catch { /* ignore */ }
  }, [numericId, todayDate])

  useEffect(() => { loadHealthLogs() }, [loadHealthLogs])

  const saveHealthLog = async (checks: Record<string, boolean>, notes: string) => {
    setSavingHealth(true)
    try {
      await apiFetch('health.php', {
        method: 'POST',
        body: JSON.stringify({ chickenId: numericId, logDate: todayDate, checks, notes: notes || null }),
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

  const isDead = !!chicken?.diedAt
  const highlightedHealthLogs = healthLogs.filter(log => Object.values(log.checks).some(Boolean) || log.notes)
  const activeTodaySymptoms = Object.entries(todayChecks).filter(([, value]) => value)

  const startEditing = () => {
    setEditName(chicken.name)
    setEditBreed(chicken.breed ?? '')
    setEditNotes(chicken.notes ?? '')
    setEditHatchedAt(chicken.hatchedAt ?? '')
    setEditDiedAt(chicken.diedAt ?? '')
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
        hatchedAt: editHatchedAt || null,
        diedAt: editDiedAt || null,
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
    const startOfDay = dateInputToTimestamp(eggDate, 8, 0)
    if (startOfDay === null) return

    setAddingEggs(true)
    try {
      for (let i = 0; i < eggCount; i++) {
        await addEgg(chicken.id, startOfDay + i * 60_000)
      }
      setShowEggModal(false)
      setEggCount(1)
      setEggDate(formatDateInput(new Date()))
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

  const closeMedicationModal = () => {
    setShowMedicationModal(false)
    setEditingMedicationId(null)
    setMedicationForm(createMedicationForm())
    setMedicationError('')
  }

  const openMedicationCreate = () => {
    setEditingMedicationId(null)
    setMedicationForm(createMedicationForm())
    setMedicationError('')
    setShowMedicationModal(true)
  }

  const openMedicationEdit = (medication: Medication) => {
    setEditingMedicationId(medication.id)
    setMedicationForm({
      name: medication.name,
      startDate: timestampToDateInput(medication.startDate),
      endDate: timestampToDateInput(medication.endDate),
      notes: medication.notes ?? '',
    })
    setMedicationError('')
    setShowMedicationModal(true)
  }

  const handleSaveMedication = async () => {
    const name = medicationForm.name.trim()
    const startDate = dateInputToTimestamp(medicationForm.startDate)
    const endDate = medicationForm.endDate
      ? dateInputToTimestamp(medicationForm.endDate)
      : null

    if (!name) {
      setMedicationError('Bitte einen Medikamentennamen eingeben.')
      return
    }
    if (startDate === null) {
      setMedicationError('Bitte ein Startdatum wählen.')
      return
    }
    if (endDate !== null && endDate < startDate) {
      setMedicationError('Das Ende darf nicht vor dem Start liegen.')
      return
    }

    setSavingMedication(true)
    setMedicationError('')

    try {
      const payload = {
        name,
        startDate,
        endDate,
        notes: medicationForm.notes.trim() || null,
      }

      if (editingMedicationId) {
        await updateMedication(editingMedicationId, payload)
      } else {
        await addMedication(payload)
      }

      closeMedicationModal()
    } catch (err) {
      console.error('Medication save failed:', err)
      setMedicationError(err instanceof Error ? err.message : 'Medikation konnte nicht gespeichert werden.')
    } finally {
      setSavingMedication(false)
    }
  }

  const handleDeleteMedication = async (medicationId: number) => {
    try {
      await deleteMedication(medicationId)
      setMedicationToDelete(null)
    } catch (err) {
      console.error('Medication delete failed:', err)
    }
  }

  const closeMoultModal = () => {
    setShowMoultModal(false)
    setEditingMoultId(null)
    setMoultForm(createMoultForm())
    setMoultError('')
  }

  const openMoultCreate = () => {
    setEditingMoultId(null)
    setMoultForm(createMoultForm())
    setMoultError('')
    setShowMoultModal(true)
  }

  const openMoultEdit = (period: MoultPeriod) => {
    setEditingMoultId(period.id)
    setMoultForm({
      startDate: timestampToDateInput(period.startDate),
      endDate: timestampToDateInput(period.endDate),
      notes: period.notes ?? '',
    })
    setMoultError('')
    setShowMoultModal(true)
  }

  const handleSaveMoult = async () => {
    const startDate = dateInputToTimestamp(moultForm.startDate)
    const endDate = moultForm.endDate
      ? dateInputToTimestamp(moultForm.endDate)
      : null

    if (startDate === null) {
      setMoultError('Bitte ein Startdatum wählen.')
      return
    }
    if (endDate !== null && endDate < startDate) {
      setMoultError('Das Ende darf nicht vor dem Start liegen.')
      return
    }

    setSavingMoult(true)
    setMoultError('')

    try {
      const payload = {
        startDate,
        endDate,
        notes: moultForm.notes.trim() || null,
      }

      if (editingMoultId) {
        await updateMoultPeriod(editingMoultId, payload)
      } else {
        await addMoultPeriod(payload)
      }

      closeMoultModal()
    } catch (err) {
      console.error('Moult save failed:', err)
      setMoultError(err instanceof Error ? err.message : 'Mauser konnte nicht gespeichert werden.')
    } finally {
      setSavingMoult(false)
    }
  }

  const handleDeleteMoult = async (periodId: number) => {
    try {
      await deleteMoultPeriod(periodId)
      setMoultToDelete(null)
    } catch (err) {
      console.error('Moult delete failed:', err)
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
              <h1 className="font-bold text-gray-900 text-lg truncate flex items-center gap-1.5">
                {isDead && <Skull className="w-4 h-4 text-gray-400 shrink-0" />}
                {chicken.name}
              </h1>
              <p className="text-xs text-gray-400 truncate">
                {[
                  chicken.breed,
                  chicken.hatchedAt && `geb. ${formatDateLabel(chicken.hatchedAt)}`,
                  isDead && `† ${formatDateLabel(chicken.diedAt!)}`,
                ].filter(Boolean).join(' · ')}
              </p>
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
            {!isDead && (
              <button
                onClick={() => { setEggDate(formatDateInput(new Date())); setEggCount(1); setShowEggModal(true) }}
                className="bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-full active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Ei
              </button>
            )}
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
            <label className="text-xs font-medium text-gray-500 mb-1 block">Schlüpfdatum</label>
            <input
              type="date"
              value={editHatchedAt}
              onChange={e => setEditHatchedAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Todestag</label>
            <input
              type="date"
              value={editDiedAt}
              onChange={e => setEditDiedAt(e.target.value)}
              max={todayDate}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
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
                      {formatDateLabel(egg.laidAt, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Auffälligkeiten melden
              </h3>
              <p className="text-xs text-gray-400">Nur antippen, wenn etwas nicht stimmt.</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => toggleCheck(s.key)}
                    disabled={savingHealth}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
                      todayChecks[s.key]
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-500 border border-transparent'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div>
                <input
                  value={healthNotes}
                  onChange={e => setHealthNotes(e.target.value)}
                  onBlur={() => saveHealthLog(todayChecks, healthNotes)}
                  placeholder="Freitext-Notiz..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
              {activeTodaySymptoms.length > 0 && (
                <p className="text-xs text-red-500 font-medium">
                  {activeTodaySymptoms.length} Auffälligkeit(en) heute gemeldet
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 px-1">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Mauser</h3>
                  <p className="text-xs text-gray-400">Start, Ende und Notizen zur Mauser dokumentieren.</p>
                </div>
                <button
                  onClick={openMoultCreate}
                  className="bg-green-500 text-white text-sm font-semibold px-3.5 py-2 rounded-full active:scale-95 transition-transform shadow-sm flex items-center gap-1.5 min-h-11"
                >
                  <Plus className="w-4 h-4" /> Neu
                </button>
              </div>

              {moultPeriodsLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  Mauser-Daten werden geladen...
                </div>
              ) : moultPeriods.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm px-4 py-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                    <Feather className="w-6 h-6 text-green-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Noch keine Mauser erfasst.</p>
                  <p className="mt-1 text-xs text-gray-400">Lege die erste Periode an, sobald die Mauser beginnt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moultPeriods.map(period => (
                    <div key={period.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                          <Feather className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800">{formatPeriodLabel(period.startDate, period.endDate)}</p>
                            {period.endDate === null && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-[11px] font-semibold text-green-700">
                                Läuft
                              </span>
                            )}
                          </div>
                          {period.notes && (
                            <p className="mt-1 text-sm text-gray-500">{period.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center shrink-0">
                          <button
                            onClick={() => openMoultEdit(period)}
                            className="text-gray-400 min-w-11 min-h-11 flex items-center justify-center active:text-green-600"
                            aria-label="Mauser bearbeiten"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setMoultToDelete(current => current === period.id ? null : period.id)}
                            className="text-gray-300 min-w-11 min-h-11 flex items-center justify-center active:text-red-400"
                            aria-label="Mauser löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {moultToDelete === period.id && (
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => setMoultToDelete(null)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 active:scale-95 transition-transform"
                          >
                            Abbrechen
                          </button>
                          <button
                            onClick={() => handleDeleteMoult(period.id)}
                            className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Wirklich löschen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {healthLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">Verlauf</h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {highlightedHealthLogs.slice(0, 20).map(log => {
                    const activeSymptoms = Object.entries(log.checks)
                      .filter(([, v]) => v)
                      .map(([k]) => SYMPTOMS.find(s => s.key === k)?.label ?? k)
                    return (
                      <div key={log.id} className="px-4 py-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          <p className="text-sm font-medium text-gray-700">
                            {formatDateLabel(log.logDate, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        {activeSymptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-4">
                            {activeSymptoms.map(label => (
                              <span key={label} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                        {log.notes && <p className="text-xs text-gray-400 pl-4">{log.notes}</p>}
                      </div>
                    )
                  })}
                  {highlightedHealthLogs.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      Keine Auffälligkeiten in den letzten 30 Tagen
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medikation' && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 px-1">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Behandlungen</h3>
                <p className="text-xs text-gray-400">Medikamente, Zeitraum und Notizen pro Huhn festhalten.</p>
              </div>
              <button
                onClick={openMedicationCreate}
                className="bg-green-500 text-white text-sm font-semibold px-3.5 py-2 rounded-full active:scale-95 transition-transform shadow-sm flex items-center gap-1.5 min-h-11"
              >
                <Plus className="w-4 h-4" /> Neu
              </button>
            </div>

            {medicationsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                Medikationen werden geladen...
              </div>
            ) : medications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm px-4 py-8 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Pill className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">Noch keine Medikation erfasst.</p>
                <p className="mt-1 text-xs text-gray-400">Lege eine Behandlung an, um Start, Ende und Hinweise festzuhalten.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map(medication => (
                  <div key={medication.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">{medication.name}</p>
                          {medication.endDate === null && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                              Läuft
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{formatPeriodLabel(medication.startDate, medication.endDate)}</p>
                        {medication.notes && (
                          <p className="mt-2 text-sm text-gray-500">{medication.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() => openMedicationEdit(medication)}
                          className="text-gray-400 min-w-11 min-h-11 flex items-center justify-center active:text-green-600"
                          aria-label="Medikation bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMedicationToDelete(current => current === medication.id ? null : medication.id)}
                          className="text-gray-300 min-w-11 min-h-11 flex items-center justify-center active:text-red-400"
                          aria-label="Medikation löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {medicationToDelete === medication.id && (
                      <div className="border-t border-gray-100 pt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => setMedicationToDelete(null)}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 active:scale-95 transition-transform"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleDeleteMedication(medication.id)}
                          className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Wirklich löschen
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                max={todayDate}
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
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={eggCount}
                  onChange={e => { const v = parseInt(e.target.value); if (v > 0) setEggCount(v); else if (e.target.value === '') setEggCount(1) }}
                  className="text-3xl font-bold text-gray-900 w-16 text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
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

      {showMedicationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => !savingMedication && closeMedicationModal()}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl safe-area-bottom" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-500" />
              {editingMedicationId ? 'Medikation bearbeiten' : 'Medikation erfassen'}
            </h3>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
              <input
                value={medicationForm.name}
                onChange={e => setMedicationForm(current => ({ ...current, name: e.target.value }))}
                placeholder="z.B. Baytril, Vitaminmix..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Start</label>
                <input
                  type="date"
                  value={medicationForm.startDate}
                  onChange={e => setMedicationForm(current => ({ ...current, startDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Ende</label>
                <input
                  type="date"
                  value={medicationForm.endDate}
                  onChange={e => setMedicationForm(current => ({ ...current, endDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Notizen</label>
              <textarea
                rows={3}
                value={medicationForm.notes}
                onChange={e => setMedicationForm(current => ({ ...current, notes: e.target.value }))}
                placeholder="Dosierung, Hinweise, Beobachtungen..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"
              />
            </div>

            {medicationError && (
              <p className="text-sm text-red-500">{medicationError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeMedicationModal}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveMedication}
                disabled={savingMedication}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingMedication ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{editingMedicationId ? 'Speichern' : 'Anlegen'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoultModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => !savingMoult && closeMoultModal()}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl safe-area-bottom" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Feather className="w-5 h-5 text-green-500" />
              {editingMoultId ? 'Mauser bearbeiten' : 'Mauser erfassen'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Start</label>
                <input
                  type="date"
                  value={moultForm.startDate}
                  onChange={e => setMoultForm(current => ({ ...current, startDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Ende</label>
                <input
                  type="date"
                  value={moultForm.endDate}
                  onChange={e => setMoultForm(current => ({ ...current, endDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Notizen</label>
              <textarea
                rows={3}
                value={moultForm.notes}
                onChange={e => setMoultForm(current => ({ ...current, notes: e.target.value }))}
                placeholder="z.B. starke Federverluste, neue Federn sichtbar..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"
              />
            </div>

            {moultError && (
              <p className="text-sm text-red-500">{moultError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeMoultModal}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveMoult}
                disabled={savingMoult}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingMoult ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{editingMoultId ? 'Speichern' : 'Anlegen'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
