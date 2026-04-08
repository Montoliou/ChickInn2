import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { Plus, X, Camera, Bird } from 'lucide-react'

export function ChickensPage() {
  const { chickens, addChicken, deleteChicken } = useChickens()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setName(''); setBreed(''); setNotes(''); setPhotoFile(null); setPhotoPreview(null); setShowForm(false)
  }

  const handleSave = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      let photoUrl: string | undefined
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }
      await addChicken({
        name: name.trim(),
        breed: breed.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUrl,
      })
      resetForm()
    } catch (err) {
      console.error('Failed to save chicken:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hühner</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow active:scale-95 transition-transform"
          aria-label="Huhn hinzufügen"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm">
          <h2 className="font-semibold text-gray-800">Neues Huhn</h2>

          {/* Photo picker */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-green-50 border-2 border-dashed border-green-300 flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
              aria-label="Foto aufnehmen"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Vorschau" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-7 h-7 text-green-400" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name *"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400"
          />
          <input
            value={breed}
            onChange={e => setBreed(e.target.value)}
            placeholder="Rasse (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notiz (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={resetForm}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-base"
            >Abbrechen</button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white text-base font-medium disabled:opacity-40"
            >{saving ? 'Speichert...' : 'Speichern'}</button>
          </div>
        </div>
      )}

      {/* List */}
      {chickens.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-400">
          <Bird className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Noch keine Hühner.<br />Tippe auf + um eines anzulegen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {chickens.map(chicken => (
            <div key={chicken.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/chickens/${chicken.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full bg-green-100 border border-green-200 flex items-center justify-center overflow-hidden shrink-0">
                  {chicken.photoUrl
                    ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
                    : <Bird className="w-5 h-5 text-green-600" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{chicken.name}</p>
                  {chicken.breed && <p className="text-xs text-gray-400 truncate">{chicken.breed}</p>}
                </div>
              </Link>
              <button
                onClick={() => { if (confirm(`${chicken.name} wirklich löschen?`)) deleteChicken(chicken.id) }}
                className="text-gray-300 p-2 active:text-red-400 shrink-0"
                aria-label={`${chicken.name} löschen`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
