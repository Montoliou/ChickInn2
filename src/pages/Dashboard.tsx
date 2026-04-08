import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { Egg, Plus } from 'lucide-react'

function isSameDay(ts: number, now: Date) {
  const d = new Date(ts)
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}
function isSameWeek(ts: number, now: Date) {
  const d = new Date(ts)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}
function isSameMonth(ts: number, now: Date) {
  const d = new Date(ts)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}
function isSameYear(ts: number, now: Date) {
  return new Date(ts).getFullYear() === now.getFullYear()
}

export function Dashboard() {
  const { chickens } = useChickens()
  const { eggs, addEgg } = useEggs()
  const now = new Date()

  const stats = [
    { label: 'Heute', value: eggs.filter(e => isSameDay(e.laidAt, now)).length },
    { label: 'Woche', value: eggs.filter(e => isSameWeek(e.laidAt, now)).length },
    { label: 'Monat', value: eggs.filter(e => isSameMonth(e.laidAt, now)).length },
    { label: 'Jahr', value: eggs.filter(e => isSameYear(e.laidAt, now)).length },
  ]

  return (
    <div className="p-4 space-y-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-4xl font-bold text-green-600 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick egg log */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Ei schnell erfassen</h2>
        {chickens.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Noch keine Hühner — lege erst ein Huhn unter "Hühner" an.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {chickens.map(chicken => (
              <button
                key={chicken.id}
                onClick={() => addEgg(chicken.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center overflow-hidden">
                  {chicken.photoUrl
                    ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
                    : <Plus className="w-6 h-6 text-green-500" />
                  }
                </div>
                <span className="text-xs text-gray-600 max-w-16 truncate">{chicken.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent eggs */}
      {eggs.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-2">Letzte Eier</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {eggs.slice(0, 10).map(egg => {
              const chicken = chickens.find(c => c.id === egg.chickenId)
              return (
                <div key={egg.id} className="flex items-center gap-3 px-4 py-3">
                  <Egg className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{chicken?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(egg.laidAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
