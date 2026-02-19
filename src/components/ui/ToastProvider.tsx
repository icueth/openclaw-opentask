'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import GlassCard from '@/components/GlassCard'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-neon-green" />,
    error: <AlertCircle className="w-5 h-5 text-neon-red" />,
    warning: <AlertTriangle className="w-5 h-5 text-neon-yellow" />,
    info: <Info className="w-5 h-5 text-neon-cyan" />
  }

  const variantMap = {
    success: 'cyan',
    error: 'pink',
    warning: 'default',
    info: 'default'
  } as const

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast, index) => (
          <GlassCard
            key={toast.id}
            variant={variantMap[toast.type]}
            className="p-4 flex items-center gap-3 min-w-[300px] max-w-[400px] animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
            hover={false}
          >
            {iconMap[toast.type]}
            <span className="flex-1 text-sm text-gray-200">{toast.message}</span>
            <button
              onClick={() => hideToast(toast.id)}
              className="p-1 text-gray-500 hover:text-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </GlassCard>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
