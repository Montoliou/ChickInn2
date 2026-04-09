import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { PhotoPicker } from '../components/PhotoPicker'
import { ChevronLeft, Egg, Feather, Pill, Plus, Pencil, Check, Trash2 } from 'lucide-react'

type Tab = 'eier' | 'mauser' | 'medikation'

export function ChickenDetail() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()
  const { chickens, updateChicken, deleteChicken } = useChickens()
  const { eggs, addEgg, deleteEgg } = useEggs(numericId)
  const [activeTab, setActiveTab] = useState<Tab>('eier')
  const [uploading, setUploading] = useState(false)
  const [eggToDelete, setEggToDelete] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBreed, setEditBreed] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  const tabs: { key: Tab; label: string; Icon: typeof Egg }[] = [
    { key: 'eier', label: 'Eier', Icon: Egg },
    { key: 'mauser', label: 'Mauser', Icon: Feather },
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
              onClick={() => addEgg(chicken.id)}
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
          eggs.length === 0
            ? <div className="text-center text-gray-400 pt-12">
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
            )
        )}

        {activeTab === 'mauser' && (
          <div className="text-center text-gray-400 pt-12">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Feather className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm">Mauser-Erfassung kommt bald</p>
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
    </div>
  )
}
