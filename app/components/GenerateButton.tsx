'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerateButtonProps } from '@/types'

export function GenerateButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Generate App',
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'px-6 py-3 rounded-lg font-medium text-sm',
        'bg-blue-600 text-white',
        'hover:bg-blue-700 active:bg-blue-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        'shadow-sm hover:shadow-md'
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
