import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ToastContext, type ToastInput } from './toastContext'

interface ToastItem extends ToastInput { id: number }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const dismiss = useCallback((id: number) => setToasts(current => current.filter(toast => toast.id !== id)), [])
  const showToast = useCallback((input: ToastInput | string) => {
    const toast = typeof input === 'string' ? { message: input, tone: 'success' as const } : input
    const id = Date.now() + Math.random()
    setToasts(current => [...current.slice(-2), { ...toast, id }])
    window.setTimeout(() => dismiss(id), 3800)
  }, [dismiss])
  const value = useMemo(() => ({ showToast }), [showToast])

  return <ToastContext.Provider value={value}>{children}<div className="toast-region" aria-live="polite" aria-atomic="false">{toasts.map(toast => <div className={`toast ${toast.tone ?? 'success'}`} role={toast.tone === 'error' ? 'alert' : 'status'} key={toast.id}>{toast.tone === 'error' ? <CircleAlert /> : toast.tone === 'info' ? <Info /> : <CheckCircle2 />}<span>{toast.message}</span><button type="button" onClick={() => dismiss(toast.id)} aria-label="Cerrar notificación"><X /></button></div>)}</div></ToastContext.Provider>
}
