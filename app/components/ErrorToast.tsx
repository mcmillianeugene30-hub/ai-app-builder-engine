'use client'

import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ErrorToastProps } from '@/types/error'

export function ErrorToast({ 
  message, 
  type = 'error', 
  description, 
  action,
  onClose,
}: ErrorToastProps) {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
    warning: AlertCircle,
  }
  
  const colors = {
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }
  
  const Icon = icons[type]
  
  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
      colors[type]
    )}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{message}</p>
        {description && (
          <p className="text-sm opacity-80 mt-1">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-xs font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
