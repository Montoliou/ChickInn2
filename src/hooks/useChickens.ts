import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../context/AuthContext'
import type { Chicken } from '../types'

export function useChickens() {
  const { user } = useAuth()
  const [chickens, setChickens] = useState<Chicken[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) { setChickens([]); setLoading(false); return }
    try {
      const data = await apiFetch<Chicken[]>('chickens.php')
      setChickens(data)
    } catch (err) {
      console.error('Failed to load chickens:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const addChicken = async (data: Omit<Chicken, 'id' | 'userId' | 'createdAt'>) => {
    const created = await apiFetch<Chicken>('chickens.php', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    setChickens(prev => [...prev, created])
    return created
  }

  const updateChicken = async (id: number, data: Partial<Chicken>) => {
    const updated = await apiFetch<Chicken>(`chickens.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    setChickens(prev => prev.map(c => c.id === id ? updated : c))
  }

  const deleteChicken = async (id: number) => {
    await apiFetch(`chickens.php?id=${id}`, { method: 'DELETE' })
    setChickens(prev => prev.filter(c => c.id !== id))
  }

  return { chickens, loading, addChicken, updateChicken, deleteChicken, refresh }
}
