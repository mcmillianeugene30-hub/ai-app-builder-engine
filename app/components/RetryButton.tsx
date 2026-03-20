'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RetryButtonProps } from '@/types/error'

export function RetryButton({ 
  onRetry, 
  disabled = false,
  className,
  children,
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  
  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry])
  
  return (
    <button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-md',
        'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isRetrying ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Retrying...</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          <span>{children || 'Retry'}</span>
        </>
      )}
    </button>
  )
}
