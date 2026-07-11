import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextToastId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextToastId++
    setToasts(prev => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2800)
  }, [])

  const value: ToastContextValue = {
    toast,
    success: (m: string) => toast(m, 'success'),
    error: (m: string) => toast(m, 'error'),
    info: (m: string) => toast(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
      >
        {toasts.map(t => {
          const styles = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-gray-900 text-white',
          }[t.type]
          const Icon = { success: CheckCircle2, error: AlertCircle, info: Info }[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2 rounded-full shadow-lg px-4 py-2.5 max-w-sm text-sm font-medium animate-[slideUp_0.25s_ease-out] ${styles}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
