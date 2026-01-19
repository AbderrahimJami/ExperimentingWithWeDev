import { createContext, useContext, useState } from 'react'

const ToastContext = createContext(null)

const toneStyles = {
  success: 'border-brand/30 bg-brand/10 text-ink',
  info: 'border-clay/70 bg-mist text-ink',
  warning: 'border-sun/50 bg-sun/10 text-ink',
  error: 'border-rose/40 bg-rose/10 text-rose',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const addToast = ({ message, tone = 'info', duration = 3500 }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, message, tone }])

    if (duration && duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed bottom-6 left-6 right-6 z-50 flex flex-col gap-3 sm:left-auto sm:max-w-sm"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft ${toneStyles[toast.tone] || toneStyles.info}`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-xs font-semibold text-slate hover:text-ink"
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
