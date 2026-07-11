import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../context/AuthContext'
import type { Medication } from '../types'

interface MedicationPayload {
  name: string
  startDate: number
  endDate?: number | null
  notes?: string | null
}

function sortMedications(items: Medication[]) {
  return [...items].sort((a, b) => {
    if (a.endDate === null && b.endDate !== null) return -1
    if (a.endDate !== null && b.endDate === null) return 1
    return b.startDate - a.startDate
  })
}

export function useMedications(chickenId?: number) {
  const { user } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user || !chickenId) {
      setMedications([])
      setLoading(false)
      return
    }

    try {
      const data = await apiFetch<Medication[]>(`medications.php?chickenId=${chickenId}`)
      setMedications(sortMedications(data))
    } catch (err) {
      console.error('Failed to load medications:', err)
    } finally {
      setLoading(false)
    }
  }, [user, chickenId])

  useEffect(() => { refresh() }, [refresh])

  const addMedication = async (data: MedicationPayload) => {
    if (!chickenId) throw new Error('chickenId is required')

    const created = await apiFetch<Medication>('medications.php', {
      method: 'POST',
      body: JSON.stringify({
        chickenId,
        ...data,
      }),
    })

    setMedications(prev => sortMedications([created, ...prev]))
    return created
  }

  const updateMedication = async (id: number, data: Partial<MedicationPayload>) => {
    const updated = await apiFetch<Medication>(`medications.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    setMedications(prev => sortMedications(prev.map(item => item.id === id ? updated : item)))
    return updated
  }

  const deleteMedication = async (id: number) => {
    await apiFetch(`medications.php?id=${id}`, { method: 'DELETE' })
    setMedications(prev => prev.filter(item => item.id !== id))
  }

  return { medications, loading, refresh, addMedication, updateMedication, deleteMedication }
}
