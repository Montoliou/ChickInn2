export interface Chicken {
  id: number
  userId: number
  name: string
  breed?: string | null
  notes?: string | null
  photoUrl?: string | null
  eggPhotoUrl?: string | null
  createdAt: number // Unix timestamp ms
}

export interface Egg {
  id: number
  chickenId: number
  userId: number
  laidAt: number // Unix timestamp ms
  notes?: string | null
}

export interface MoultPeriod {
  id: number
  chickenId: number
  userId: number
  startDate: number
  endDate?: number | null
  notes?: string | null
}

export interface Medication {
  id: number
  chickenId: number
  userId: number
  name: string
  startDate: number
  endDate: number
  notes?: string | null
}
