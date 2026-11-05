import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts((current) => [...current, { id, message, type }])
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || Info
            return (
              <div className={`toast toast--${toast.type}`} key={toast.id} role="status">
                <Icon size={19} aria-hidden="true" />
                <span>{toast.message}</span>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={15} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
