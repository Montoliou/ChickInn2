import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../context/AuthContext'
import type { Egg } from '../types'

export function useEggs(chickenId?: number) {
  const { user } = useAuth()
  const [eggs, setEggs] = useState<Egg[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) { setEggs([]); setLoading(false); return }
    try {
      const endpoint = chickenId
        ? `eggs.php?chickenId=${chickenId}`
        : 'eggs.php'
      const data = await apiFetch<Egg[]>(endpoint)
      setEggs(data)
    } catch (err) {
      console.error('Failed to load eggs:', err)
    } finally {
      setLoading(false)
    }
  }, [user, chickenId])

  useEffect(() => { refresh() }, [refresh])

  const addEgg = async (chickenId: number, laidAt?: number) => {
    const created = await apiFetch<Egg>('eggs.php', {
      method: 'POST',
      body: JSON.stringify({
        chickenId,
        laidAt: laidAt ?? Date.now(),
      }),
    })
    setEggs(prev => [created, ...prev])
  }

  const deleteEgg = async (id: number) => {
    await apiFetch(`eggs.php?id=${id}`, { method: 'DELETE' })
    setEggs(prev => prev.filter(e => e.id !== id))
  }

  return { eggs, loading, addEgg, deleteEgg, refresh }
}
