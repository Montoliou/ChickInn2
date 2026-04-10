import { useState, useRef, type ReactNode, type TouchEvent } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: ReactNode
}

const THRESHOLD = 70
const MAX_PULL = 110

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const tracking = useRef(false)

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (refreshing) return
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    tracking.current = true
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!tracking.current || refreshing) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0) {
      setPull(0)
      return
    }
    const damped = Math.min(dy * 0.5, MAX_PULL)
    setPull(damped)
  }

  const handleTouchEnd = async () => {
    if (!tracking.current) return
    tracking.current = false
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPull(48)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPull(0)
      }
    } else {
      setPull(0)
    }
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
      <div
        className="flex justify-center items-end overflow-hidden"
        style={{
          height: `${pull}px`,
          transition: tracking.current ? 'none' : 'height 0.2s ease-out',
        }}
      >
        <div className="pb-2">
          <RefreshCw
            className={`w-5 h-5 text-green-500 ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)` }}
          />
        </div>
      </div>
      {children}
    </div>
  )
}
