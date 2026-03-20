'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { PromptInputProps } from '@/types'

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Describe the app you want to build...',
  maxLength = 5000,
}: PromptInputProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit]
  )

  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.9

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          className={cn(
            'w-full resize-none rounded-lg border bg-white px-4 py-3',
            'text-sm text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'border-gray-300'
          )}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <span
            className={cn(
              'text-xs',
              isNearLimit ? 'text-orange-500 font-medium' : 'text-gray-400'
            )}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Press Cmd/Ctrl + Enter to generate
      </p>
    </div>
  )
}
