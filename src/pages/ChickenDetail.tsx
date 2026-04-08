import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { ChevronLeft, Egg, Feather, Pill, Plus, X, Camera, Bird } from 'lucide-react'

type Tab = 'eier' | 'mauser' | 'medikation'

export function ChickenDetail() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()
  const { chickens, updateChicken } = useChickens()
  const { eggs, addEgg, deleteEgg } = useEggs(numericId)
  const [activeTab, setActiveTab] = useState<Tab>('eier')
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const chicken = chickens.find(c => c.id === numericId)
  if (!chicken) return (
    <div className="p-4 text-center text-gray-400 pt-20">Huhn nicht gefunden.</div>
  )

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
          onClick={() => navigate(-1)}
          className="text-green-600 p-1 min-w-11 min-h-11 flex items-center justify-center"
          aria-label="Zurück"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Photo (tappable to change) */}
        <button
          onClick={() => photoInputRef.current?.click()}
          className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0 relative"
          aria-label="Foto ändern"
          disabled={uploading}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : chicken.photoUrl ? (
            <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
          ) : (
            <Bird className="w-5 h-5 text-green-600" />
          )}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Camera className="w-2.5 h-2.5 text-white" />
          </div>
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />

        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-gray-900 text-lg truncate">{chicken.name}</h1>
          {chicken.breed && <p className="text-xs text-gray-400 truncate">{chicken.breed}</p>}
        </div>

        <button
          onClick={() => addEgg(chicken.id)}
          className="bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-full active:scale-95 transition-transform flex items-center gap-1 shrink-0"
        >
          <Plus className="w-4 h-4" /> Ei
        </button>
      </div>

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
                <Egg className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Noch keine Eier erfasst.</p>
              </div>
            : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {eggs.map(egg => (
                  <div key={egg.id} className="flex items-center gap-3 px-4 py-3">
                    <Egg className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">
                      {new Date(egg.laidAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => deleteEgg(egg.id)}
                      className="text-gray-300 active:text-red-400 p-2 min-w-11 min-h-11 flex items-center justify-center"
                      aria-label="Ei löschen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
        )}

        {activeTab === 'mauser' && (
          <div className="text-center text-gray-400 pt-12">
            <Feather className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Mauser-Erfassung kommt bald</p>
          </div>
        )}

        {activeTab === 'medikation' && (
          <div className="text-center text-gray-400 pt-12">
            <Pill className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Medikations-Erfassung kommt bald</p>
          </div>
        )}
      </div>
    </div>
  )
}
