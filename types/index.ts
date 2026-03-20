import { z } from 'zod'

// JSON Schema for AI response validation
export const AppGenerationSchema = z.object({
  frontend: z.string().min(10).describe('Complete frontend code with React/Vue/Next.js components'),
  backend: z.string().min(10).describe('Complete backend API routes or server code'),
  database: z.string().min(10).describe('Database schema, migrations, or queries'),
})

export type AppGenerationOutput = z.infer<typeof AppGenerationSchema>

// API Request/Response types
export interface GenerateRequest {
  prompt: string
}

export interface GenerateSuccessResponse {
  success: true
  data: AppGenerationOutput
  retries: number
  latencyMs: number
}

export interface GenerateErrorResponse {
  success: false
  error: string
  code: 'VALIDATION_ERROR' | 'AI_ERROR' | 'MAX_RETRIES_EXCEEDED' | 'TIMEOUT' | 'UNKNOWN'
  details?: string
}

export type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse

// Component Props
export interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export interface GenerateButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
}

export interface OutputParserProps {
  data: AppGenerationOutput | null
  error: string | null
  loading?: boolean
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

// AI Provider types
export interface AIProviderConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  timeoutMs: number
}
