import { z } from 'zod'
import type { AppGenerationOutput, GenerateErrorResponse } from '@/types'
import { AppGenerationSchema } from '@/types'

export class ValidationError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validates AI response against the JSON schema
 * @param response - The raw response from AI
 * @returns Validated output or throws ValidationError
 */
export function validateJSON(response: unknown): AppGenerationOutput {
  const result = AppGenerationSchema.safeParse(response)
  
  if (!result.success) {
    throw new ValidationError(
      `Invalid AI response structure: ${result.error.errors.map(e => e.message).join(', ')}`,
      result.error.errors
    )
  }
  
  return result.data
}

/**
 * Safely validates without throwing
 * @param response - The raw response from AI
 * @returns Object with success flag and data or error
 */
export function safeValidateJSON(response: unknown): 
  | { success: true; data: AppGenerationOutput }
  | { success: false; error: ValidationError } {
  try {
    const data = validateJSON(response)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error }
    }
    return { 
      success: false, 
      error: new ValidationError('Unknown validation error', []) 
    }
  }
}

/**
 * Extracts JSON from AI response that might contain markdown or other text
 * @param rawResponse - Raw string from AI
 * @returns Parsed JSON object
 */
export function extractJSONFromResponse(rawResponse: string): unknown {
  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // Fall through to try parsing the full response
    }
  }
  
  // Try to find JSON between curly braces
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // Fall through
    }
  }
  
  // Try parsing the whole response
  try {
    return JSON.parse(rawResponse.trim())
  } catch {
    throw new ValidationError('Could not extract valid JSON from AI response', [])
  }
}

export function createErrorResponse(
  code: GenerateErrorResponse['code'],
  error: string,
  details?: string
): GenerateErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
  }
}
