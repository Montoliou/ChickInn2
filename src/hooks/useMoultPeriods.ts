import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../context/AuthContext'
import type { MoultPeriod } from '../types'

interface MoultPayload {
  startDate: number
  endDate?: number | null
  notes?: string | null
}

function sortMoultPeriods(items: MoultPeriod[]) {
  return [...items].sort((a, b) => {
    if (a.endDate === null && b.endDate !== null) return -1
    if (a.endDate !== null && b.endDate === null) return 1
    return b.startDate - a.startDate
  })
}

export function useMoultPeriods(chickenId?: number) {
  const { user } = useAuth()
  const [moultPeriods, setMoultPeriods] = useState<MoultPeriod[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user || !chickenId) {
      setMoultPeriods([])
      setLoading(false)
      return
    }

    try {
      const data = await apiFetch<MoultPeriod[]>(`moult.php?chickenId=${chickenId}`)
      setMoultPeriods(sortMoultPeriods(data))
    } catch (err) {
      console.error('Failed to load moult periods:', err)
    } finally {
      setLoading(false)
    }
  }, [user, chickenId])

  useEffect(() => { refresh() }, [refresh])

  const addMoultPeriod = async (data: MoultPayload) => {
    if (!chickenId) throw new Error('chickenId is required')

    const created = await apiFetch<MoultPeriod>('moult.php', {
      method: 'POST',
      body: JSON.stringify({
        chickenId,
        ...data,
      }),
    })

    setMoultPeriods(prev => sortMoultPeriods([created, ...prev]))
    return created
  }

  const updateMoultPeriod = async (id: number, data: Partial<MoultPayload>) => {
    const updated = await apiFetch<MoultPeriod>(`moult.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    setMoultPeriods(prev => sortMoultPeriods(prev.map(item => item.id === id ? updated : item)))
    return updated
  }

  const deleteMoultPeriod = async (id: number) => {
    await apiFetch(`moult.php?id=${id}`, { method: 'DELETE' })
    setMoultPeriods(prev => prev.filter(item => item.id !== id))
  }

  return { moultPeriods, loading, refresh, addMoultPeriod, updateMoultPeriod, deleteMoultPeriod }
}
