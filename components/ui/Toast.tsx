'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: Toast | null
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString()
    setToast({ id, message, type })
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 3000)
  }, [])

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600'
      case 'error':
        return 'bg-red-600'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-brand-charcoal'
    }
  }

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/15 animate-slide-in-right no-print max-w-[92vw] sm:max-w-md ${getBgColor(
            toast.type
          )}`}
        >
          <span className="text-lg font-bold">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="font-body text-sm font-semibold tracking-wide leading-tight">
            {toast.message}
          </span>
          <button
            onClick={hideToast}
            className="ml-auto text-white/70 hover:text-white text-xs font-bold pl-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
