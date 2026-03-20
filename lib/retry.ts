import type { RetryConfig } from '@/types'

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

/**
 * Calculates exponential backoff delay
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1)
  return Math.min(delay, config.maxDelayMs)
}

/**
 * Sleeps for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Retry on network errors, rate limits, timeouts
    const retryableMessages = [
      'timeout',
      'rate limit',
      'too many requests',
      'econnreset',
      'econnrefused',
      'enetunreach',
      'temporary',
      'internal server error',
    ]
    
    const errorMessage = error.message.toLowerCase()
    return retryableMessages.some(msg => errorMessage.includes(msg))
  }
  return false
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDelayMs: number
}

/**
 * Executes a function with exponential backoff retry logic
 * @param fn - The function to execute
 * @param config - Retry configuration
 * @returns RetryResult with success status, data/error, and metadata
 */
export async function retryOnFailure<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined
  let totalDelayMs = 0
  
  for (let attempt = 1; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts: attempt,
        totalDelayMs,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on the last attempt
      if (attempt === fullConfig.maxRetries) {
        break
      }
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDelayMs,
        }
      }
      
      const delay = calculateDelay(attempt, fullConfig)
      totalDelayMs += delay
      await sleep(delay)
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 200
    totalDelayMs += jitter
    await sleep(jitter)
  }
  
  return {
    success: false,
    error: lastError,
    attempts: fullConfig.maxRetries,
    totalDelayMs,
  }
}
