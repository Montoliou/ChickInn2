import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { PhotoPicker } from '../components/PhotoPicker'
import { Plus, X, Bird, ChevronRight } from 'lucide-react'

export function ChickensPage() {
  const { chickens, addChicken, deleteChicken } = useChickens()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handlePhotoSelect = (file: File) => {
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
          className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          aria-label="Huhn hinzufügen"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 text-center">Neues Huhn</h2>

          <div className="flex justify-center">
            <PhotoPicker
              preview={photoPreview}
              onSelect={handlePhotoSelect}
              size="lg"
            />
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name *"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-shadow"
          />
          <input
            value={breed}
            onChange={e => setBreed(e.target.value)}
            placeholder="Rasse (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-shadow"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notiz (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none transition-shadow"
          />
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-base font-medium active:scale-[0.98] transition-transform"
            >Abbrechen</button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white text-base font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform shadow-sm"
            >{saving ? 'Speichert...' : 'Speichern'}</button>
          </div>
        </div>
      )}

      {/* List */}
      {chickens.length === 0 && !showForm ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bird className="w-8 h-8 text-green-300" />
          </div>
          <p className="font-medium text-gray-500">Noch keine Hühner</p>
          <p className="text-sm mt-1">Tippe auf + um eines anzulegen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chickens.map(chicken => (
            <div key={chicken.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
              <Link to={`/chickens/${chicken.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center overflow-hidden shrink-0">
                  {chicken.photoUrl
                    ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
                    : <Bird className="w-5 h-5 text-green-500" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{chicken.name}</p>
                  {chicken.breed && <p className="text-sm text-gray-400 truncate">{chicken.breed}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
              <button
                onClick={() => { if (confirm(`${chicken.name} wirklich löschen?`)) deleteChicken(chicken.id) }}
                className="text-gray-300 p-2 active:text-red-400 shrink-0 min-w-11 min-h-11 flex items-center justify-center"
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
