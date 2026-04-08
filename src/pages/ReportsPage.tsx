import { useEggs } from '../hooks/useEggs'
import { useChickens } from '../hooks/useChickens'
import { BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export function ReportsPage() {
  const { eggs } = useEggs()
  const { chickens } = useChickens()

  // Last 12 weeks
  const weeklyData = (() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const weekDate = new Date(now)
      weekDate.setDate(now.getDate() - (11 - i) * 7)
      const weekStart = new Date(weekDate)
      weekStart.setDate(weekDate.getDate() - weekDate.getDay() + 1)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const count = eggs.filter(e => e.laidAt >= weekStart.getTime() && e.laidAt < weekEnd.getTime()).length
      return { label: `KW${Math.ceil((weekStart.getDate()) / 7)}`, count }
    })
  })()

  const perChicken = chickens.map(c => ({
    name: c.name,
    count: eggs.filter(e => e.chickenId === c.id).length,
  })).sort((a, b) => b.count - a.count)

  return (
    <div className="p-4 space-y-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <h1 className="text-2xl font-bold text-gray-900">Auswertung</h1>

      {eggs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Noch keine Daten.<br />Erfasse Eier im Dashboard.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Eier je Woche (letzte 12)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Eier" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Gesamt pro Huhn</h2>
            <div className="space-y-2">
              {perChicken.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 flex-1 truncate">{c.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full transition-all"
                      style={{ width: `${perChicken[0].count ? (c.count / perChicken[0].count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8 text-right">{c.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Gesamt: {eggs.length} Eier</p>
          </div>
        </>
      )}
    </div>
  )
}
