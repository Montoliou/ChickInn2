export interface Chicken {
  id: number
  userId: number
  farmId?: number | null
  name: string
  breed?: string | null
  notes?: string | null
  photoUrl?: string | null
  eggPhotoUrl?: string | null
  hatchedAt?: string | null  // DATE string "YYYY-MM-DD"
  diedAt?: string | null     // DATE string "YYYY-MM-DD"
  initialEggCount?: number   // Eggs laid before app tracking
  createdAt: number // Unix timestamp ms
}

export interface Egg {
  id: number
  chickenId: number
  userId: number
  farmId?: number | null
  laidAt: number // Unix timestamp ms
  notes?: string | null
}

export interface MoultPeriod {
  id: number
  chickenId: number
  userId: number
  farmId?: number | null
  startDate: number
  endDate: number | null
  notes?: string | null
}

export interface Medication {
  id: number
  chickenId: number
  userId: number
  farmId?: number | null
  name: string
  startDate: number
  endDate: number | null
  notes?: string | null
}
