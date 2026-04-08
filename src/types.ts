export interface Chicken {
  id: string
  userId: string
  name: string
  notes?: string
  photoUrl?: string
  createdAt: number // Unix timestamp ms
}

export interface Egg {
  id: string
  chickenId: string
  userId: string
  laidAt: number // Unix timestamp ms
  notes?: string
}

export interface MoultPeriod {
  id: string
  chickenId: string
  userId: string
  startDate: number
  endDate?: number
  notes?: string
}

export interface Medication {
  id: string
  chickenId: string
  userId: string
  name: string
  startDate: number
  endDate: number
  notes?: string
}
