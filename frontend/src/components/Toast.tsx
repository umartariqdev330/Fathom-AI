import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, Check } from 'lucide-react'

type Toast = { id: number; message: string; tone: 'success' | 'error' }

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => {})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-rise flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink shadow-lg"
          >
            {toast.tone === 'success' ? (
              <Check size={15} className="text-positive" />
            ) : (
              <AlertCircle size={15} className="text-critical" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
