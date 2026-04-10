import { useState, useRef, type ReactNode, type TouchEvent } from 'react'
import { Trash2 } from 'lucide-react'

interface SwipeableRowProps {
  onDelete: () => void
  children: ReactNode
  disabled?: boolean
}

const REVEAL_WIDTH = 88
const COMMIT_THRESHOLD = 60

export function SwipeableRow({ onDelete, children, disabled = false }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [animating, setAnimating] = useState(true)
  const startX = useRef(0)
  const startY = useRef(0)
  const locked = useRef<'h' | 'v' | null>(null)

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    locked.current = null
    setAnimating(false)
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (locked.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        locked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }
    }

    if (locked.current !== 'h') return

    const base = revealed ? -REVEAL_WIDTH : 0
    const next = Math.min(0, Math.max(-REVEAL_WIDTH - 20, base + dx))
    setOffset(next)
  }

  const handleTouchEnd = () => {
    if (disabled) return
    setAnimating(true)
    if (offset < -COMMIT_THRESHOLD) {
      setOffset(-REVEAL_WIDTH)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
    locked.current = null
  }

  const handleDelete = () => {
    setAnimating(true)
    setOffset(0)
    setRevealed(false)
    onDelete()
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={handleDelete}
          className="h-full w-22 bg-red-500 text-white flex items-center justify-center gap-1.5 text-sm font-semibold active:bg-red-600 min-w-22"
          style={{ width: REVEAL_WIDTH }}
          aria-label="Löschen"
        >
          <Trash2 className="w-4 h-4" />
          Löschen
        </button>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 0.2s ease-out' : 'none',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}
