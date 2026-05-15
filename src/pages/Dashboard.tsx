import { useState, useRef, useEffect } from 'react'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PullToRefresh } from '../components/PullToRefresh'
import { StatCardSkeleton, ListRowSkeleton, Skeleton } from '../components/Skeleton'
import { Egg, Plus, Bird, TrendingUp, Check } from 'lucide-react'
import type { Chicken } from '../types'
import { playConfirmSound, primeAudio } from '../utils/sound'

type QuickLogDay = 'today' | 'yesterday'

const HOLD_MS = 1000

/** Press-and-hold (1s) button that logs an egg, with a fill animation + chime. */
function QuickEggButton({ chicken, onLog }: { chicken: Chicken; onLog: () => Promise<void> }) {
  const [phase, setPhase] = useState<'idle' | 'holding' | 'done'>('idle')
  const holdTimer = useRef<number | null>(null)
  const doneTimer = useRef<number | null>(null)
  const busy = useRef(false)

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    if (doneTimer.current) clearTimeout(doneTimer.current)
  }, [])

  const cancelHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
    setPhase(p => (p === 'holding' ? 'idle' : p))
  }

  const startHold = () => {
    if (phase !== 'idle' || busy.current) return
    primeAudio()
    setPhase('holding')
    holdTimer.current = window.setTimeout(async () => {
      holdTimer.current = null
      busy.current = true
      try {
        await onLog()
        playConfirmSound()
        setPhase('done')
        doneTimer.current = window.setTimeout(() => setPhase('idle'), 1400)
      } catch {
        setPhase('idle')
      } finally {
        busy.current = false
      }
    }, HOLD_MS)
  }

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={e => e.preventDefault()}
      className={`flex flex-col items-center gap-1.5 shrink-0 select-none transition-transform ${
        phase === 'holding' ? 'scale-90' : ''
      }`}
      style={{ touchAction: 'pan-x' }}
    >
      <div
        className={`relative w-14 h-14 rounded-full bg-linear-to-br from-green-50 to-green-100 border-2 flex items-center justify-center overflow-hidden shadow-sm ${
          phase === 'done' ? 'border-green-500' : 'border-green-300'
        }`}
      >
        {chicken.photoUrl
          ? <img src={chicken.photoUrl} alt={chicken.name} draggable={false} className="w-full h-full object-cover" />
          : <Bird className="w-6 h-6 text-green-400" />
        }
        {/* Hold progress: fills the circle from the bottom over HOLD_MS */}
        <div
          className="absolute inset-0 bg-green-500/45 origin-bottom pointer-events-none"
          style={{
            transform: phase === 'holding' ? 'scaleY(1)' : 'scaleY(0)',
            transition: `transform ${phase === 'holding' ? HOLD_MS : 150}ms linear`,
          }}
        />
        {/* Confirmation */}
        {phase === 'done' && (
          <div
            className="absolute inset-0 bg-green-500 flex items-center justify-center"
            style={{ animation: 'popIn 240ms ease-out' }}
          >
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <span className="text-xs text-gray-600 max-w-14 truncate font-medium">{chicken.name}</span>
    </button>
  )
}

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
  const { user } = useAuth()
  const { chickens, loading: chickensLoading, refresh: refreshChickens } = useChickens()
  const { eggs, loading: eggsLoading, addEgg, refresh: refreshEggs } = useEggs()
  const toast = useToast()
  const now = new Date()
  const [quickLogDay, setQuickLogDay] = useState<QuickLogDay>('today')

  const loading = chickensLoading || eggsLoading
  const firstName = user?.displayName?.split(' ')[0] ?? ''
  const greeting = now.getHours() < 12 ? 'Guten Morgen' : now.getHours() < 18 ? 'Hallo' : 'Guten Abend'

  const monthEggs = eggs.filter(e => isSameMonth(e.laidAt, now))
  const monthLabel = now.toLocaleDateString('de-DE', { month: 'long' })

  const stats = [
    { label: 'Heute', value: eggs.filter(e => isSameDay(e.laidAt, now)).length, accent: 'text-green-600' },
    { label: 'Woche', value: eggs.filter(e => isSameWeek(e.laidAt, now)).length, accent: 'text-emerald-600' },
    { label: 'Monat', value: monthEggs.length, accent: 'text-teal-600' },
    { label: 'Jahr', value: eggs.filter(e => isSameYear(e.laidAt, now)).length, accent: 'text-cyan-600' },
  ]

  const handleQuickAddEgg = async (chickenId: number, name: string) => {
    let laidAt: number | undefined
    if (quickLogDay === 'yesterday') {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      d.setHours(8, 0, 0, 0)
      laidAt = d.getTime()
    }
    try {
      await addEgg(chickenId, laidAt)
    } catch (err) {
      toast.error('Konnte Ei nicht erfassen')
      throw err
    }
    const suffix = quickLogDay === 'yesterday' ? ' (gestern)' : ''
    toast.success(`Ei von ${name} erfasst${suffix}`)
  }

  const handleRefresh = async () => {
    await Promise.all([refreshChickens(), refreshEggs()])
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-4 space-y-5" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-400">{greeting}</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              </div>
            ))}
      </div>

      {/* Quick egg log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-semibold text-gray-700">Ei schnell erfassen</h2>
          </div>
          <div className="inline-flex bg-gray-100 rounded-full p-0.5 text-xs font-medium">
            <button
              onClick={() => setQuickLogDay('today')}
              className={`px-3 py-1 rounded-full transition-colors ${
                quickLogDay === 'today' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Heute
            </button>
            <button
              onClick={() => setQuickLogDay('yesterday')}
              className={`px-3 py-1 rounded-full transition-colors ${
                quickLogDay === 'yesterday' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Gestern
            </button>
          </div>
        </div>
        {chickens.length === 0 ? (
          <div className="text-center py-6">
            <Bird className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Noch keine Hühner — lege erst ein Huhn an.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {chickens.filter(c => !c.diedAt).map(chicken => (
                <QuickEggButton
                  key={chicken.id}
                  chicken={chicken}
                  onLog={() => handleQuickAddEgg(chicken.id, chicken.name)}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">1 Sekunde gedrückt halten zum Erfassen.</p>
          </>
        )}
      </div>

      {/* Recent eggs */}
      {loading ? (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}
          </div>
        </div>
      ) : monthEggs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Eier im {monthLabel}</h2>
            <span className="text-xs text-gray-400">({monthEggs.length})</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {monthEggs.map(egg => {
              const chicken = chickens.find(c => c.id === egg.chickenId)
              return (
                <div key={egg.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    {chicken?.eggPhotoUrl
                      ? <img src={chicken.eggPhotoUrl} alt="" className="w-full h-full object-cover" />
                      : <Egg className="w-4 h-4 text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{chicken?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(egg.laidAt).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  )
}
