export interface AppError {
  code: string
  message: string
  userMessage: string
  recoverySuggestion: string
  retryable: boolean
  stack?: string
}

export interface ErrorContext {
  component?: string
  action?: string
  silent?: boolean
  onRetry?: () => void
}

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatuses?: number[]
  retryableErrors?: string[]
}

export interface ErrorToastProps {
  message: string
  type?: 'error' | 'success' | 'info' | 'warning'
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

export interface RetryButtonProps {
  onRetry: () => Promise<void>
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}
