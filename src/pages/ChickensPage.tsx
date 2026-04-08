import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'

export function ChickensPage() {
  const { chickens, addChicken, deleteChicken } = useChickens()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    await addChicken({ name: name.trim(), notes: notes.trim() || undefined })
    setName(''); setNotes(''); setShowForm(false)
  }

  return (
    <div className="p-4 space-y-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hühner</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl shadow active:scale-95 transition-transform"
        >+</button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm">
          <h2 className="font-semibold text-gray-800">Neues Huhn</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name *"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notiz (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setName(''); setNotes('') }}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm"
            >Abbrechen</button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-medium disabled:opacity-40"
            >Speichern</button>
          </div>
        </div>
      )}

      {/* List */}
      {chickens.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🐔</p>
          <p>Noch keine Hühner.<br/>Tippe auf + um eines anzulegen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {chickens.map(chicken => (
            <div key={chicken.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/chickens/${chicken.id}`} className="flex items-center gap-3 flex-1">
                <div className="w-11 h-11 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                  {chicken.photoUrl
                    ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
                    : '🐔'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{chicken.name}</p>
                  {chicken.notes && <p className="text-xs text-gray-400 truncate max-w-48">{chicken.notes}</p>}
                </div>
              </Link>
              <button
                onClick={() => { if (confirm(`${chicken.name} wirklich löschen?`)) deleteChicken(chicken.id) }}
                className="text-gray-300 p-2 active:text-red-400"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
