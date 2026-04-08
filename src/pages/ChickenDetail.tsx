import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'

type Tab = 'eier' | 'mauser' | 'medikation'

export function ChickenDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { chickens } = useChickens()
  const { eggs, addEgg, deleteEgg } = useEggs(id)
  const [activeTab, setActiveTab] = useState<Tab>('eier')

  const chicken = chickens.find(c => c.id === id)
  if (!chicken) return (
    <div className="p-4 text-center text-gray-400 pt-20">Huhn nicht gefunden.</div>
  )

  const tabs: { key: Tab; label: string }[] = [
    { key: 'eier', label: '🥚 Eier' },
    { key: 'mauser', label: '🪶 Mauser' },
    { key: 'medikation', label: '💊 Medikation' },
  ]

  return (
    <div className="flex flex-col min-h-svh" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-green-600 text-lg p-1">‹</button>
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg overflow-hidden">
          {chicken.photoUrl
            ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
            : '🐔'}
        </div>
        <h1 className="font-bold text-gray-900 text-lg">{chicken.name}</h1>
        <button
          onClick={() => addEgg(chicken.id)}
          className="ml-auto bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >+ Ei</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'text-green-600 border-b-2 border-green-500'
                : 'text-gray-500'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {activeTab === 'eier' && (
          eggs.length === 0
            ? <p className="text-center text-gray-400 pt-12">Noch keine Eier erfasst.</p>
            : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {eggs.map(egg => (
                  <div key={egg.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg">🥚</span>
                    <span className="flex-1 text-sm text-gray-700">
                      {new Date(egg.laidAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => deleteEgg(egg.id)}
                      className="text-gray-300 active:text-red-400 p-1 text-sm"
                    >✕</button>
                  </div>
                ))}
              </div>
            )
        )}

        {activeTab === 'mauser' && (
          <div className="text-center text-gray-400 pt-12">
            <p className="text-3xl mb-2">🪶</p>
            <p className="text-sm">Mauser-Erfassung kommt in Version 1.1</p>
          </div>
        )}

        {activeTab === 'medikation' && (
          <div className="text-center text-gray-400 pt-12">
            <p className="text-3xl mb-2">💊</p>
            <p className="text-sm">Medikations-Erfassung kommt in Version 1.1</p>
          </div>
        )}
      </div>
    </div>
  )
}
