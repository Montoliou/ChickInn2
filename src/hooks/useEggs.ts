import { useEffect, useState } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, deleteDoc, doc
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import type { Egg } from '../types'

export function useEggs(chickenId?: string) {
  const { user } = useAuth()
  const [eggs, setEggs] = useState<Egg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setEggs([]); setLoading(false); return }
    const constraints = [where('userId', '==', user.uid), orderBy('laidAt', 'desc')]
    if (chickenId) constraints.splice(1, 0, where('chickenId', '==', chickenId))
    const q = query(collection(db, 'eggs'), ...constraints)
    const unsub = onSnapshot(q, (snap) => {
      setEggs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Egg)))
      setLoading(false)
    })
    return unsub
  }, [user, chickenId])

  const addEgg = async (chickenId: string) => {
    if (!user) return
    await addDoc(collection(db, 'eggs'), {
      chickenId,
      userId: user.uid,
      laidAt: Date.now(),
    })
  }

  const deleteEgg = async (id: string) => {
    await deleteDoc(doc(db, 'eggs', id))
  }

  return { eggs, loading, addEgg, deleteEgg }
}
