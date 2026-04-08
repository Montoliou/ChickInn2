import { useEffect, useState } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, deleteDoc, doc, updateDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import type { Chicken } from '../types'

export function useChickens() {
  const { user } = useAuth()
  const [chickens, setChickens] = useState<Chicken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setChickens([]); setLoading(false); return }
    const q = query(
      collection(db, 'chickens'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setChickens(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chicken)))
      setLoading(false)
    })
    return unsub
  }, [user])

  const addChicken = async (data: Omit<Chicken, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return
    await addDoc(collection(db, 'chickens'), {
      ...data,
      userId: user.uid,
      createdAt: Date.now(),
    })
  }

  const updateChicken = async (id: string, data: Partial<Chicken>) => {
    await updateDoc(doc(db, 'chickens', id), data)
  }

  const deleteChicken = async (id: string) => {
    await deleteDoc(doc(db, 'chickens', id))
  }

  return { chickens, loading, addChicken, updateChicken, deleteChicken }
}
