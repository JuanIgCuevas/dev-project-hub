import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastInput {
  message: string
  tone?: ToastTone
}

export interface ToastContextValue {
  showToast: (toast: ToastInput | string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe utilizarse dentro de ToastProvider')
  return context
}
