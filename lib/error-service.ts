import { toast } from 'sonner'
import type { ErrorContext, RetryConfig, AppError } from '@/types/error'

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
}

/**
 * Global error handler with user-friendly messages
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): AppError {
  const appError = normalizeError(error, context)
  
  // Log to console
  console.error('[App Error]', appError)
  
  // Show toast notification
  if (!context?.silent) {
    toast.error(appError.userMessage, {
      description: appError.recoverySuggestion,
      action: appError.retryable
        ? {
            label: 'Retry',
            onClick: () => context?.onRetry?.(),
          }
        : undefined,
    })
  }
  
  return appError
}

function normalizeError(error: unknown, context?: ErrorContext): AppError {
  if (error instanceof Error) {
    return {
      code: extractErrorCode(error),
      message: error.message,
      userMessage: getUserFriendlyMessage(error),
      recoverySuggestion: getRecoverySuggestion(error),
      retryable: isRetryable(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: 'Something went wrong',
    recoverySuggestion: 'Please try again or contact support if the issue persists.',
    retryable: false,
  }
}

function extractErrorCode(error: Error): string {
  // Check for HTTP status codes in message
  const statusMatch = error.message.match(/\b(\d{3})\b/)
  if (statusMatch) {
    const status = parseInt(statusMatch[1])
    if (status >= 400) {
      return `HTTP_${status}`
    }
  }
  
  // Check for network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return 'NETWORK_ERROR'
  }
  
  // Check for timeout
  if (error.message.includes('timeout') || error.message.includes('aborted')) {
    return 'TIMEOUT_ERROR'
  }
  
  return 'UNKNOWN_ERROR'
}

function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection failed. Please check your internet connection.'
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'Request timed out. The server is taking too long to respond.'
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Session expired. Please sign in again.'
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return "You don't have permission to do that."
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return "We couldn't find what you're looking for."
  }
  
  if (message.includes('rate limit') || message.includes('429')) {
    return "We're experiencing high traffic. Please try again in a moment."
  }
  
  if (message.includes('ai') || message.includes('generation')) {
    return 'AI generation failed. Please try again with a different prompt.'
  }
  
  return 'Something went wrong'
}

function getRecoverySuggestion(error: Error): string {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Check your connection and try again.'
  }
  
  if (message.includes('timeout')) {
    return 'Try again later or with a simpler request.'
  }
  
  if (message.includes('rate limit')) {
    return 'Wait a few moments before trying again.'
  }
  
  if (isRetryable(error)) {
    return 'Click Retry to attempt again.'
  }
  
  return 'Refresh the page or contact support if the issue continues.'
}

function isRetryable(error: Error): boolean {
  const message = error.message
  
  // Check for retryable HTTP status codes
  const statusMatch = message.match(/\b(\d{3})\b/)
  if (statusMatch) {
    const status = parseInt(statusMatch[1])
    if (DEFAULT_RETRY_CONFIG.retryableStatuses?.includes(status)) {
      return true
    }
  }
  
  // Check for retryable network errors
  if (DEFAULT_RETRY_CONFIG.retryableErrors?.some(e => message.includes(e))) {
    return true
  }
  
  return false
}

/**
 * Retry function with exponential backoff
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry if not retryable
      if (!isRetryable(lastError)) {
        throw lastError
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelayMs
      )
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

/**
 * Error boundary handler for React components
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`[${componentName} Error]`, error, errorInfo)
    
    toast.error(`${componentName} encountered an error`, {
      description: 'Please refresh the page to continue.',
      action: {
        label: 'Reload',
        onClick: () => window.location.reload(),
      },
    })
  }
}
