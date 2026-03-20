import { NextRequest, NextResponse } from 'next/server'
import { getAIService } from '@/lib/ai-service'
import { retryOnFailure } from '@/lib/retry'
import { createErrorResponse } from '@/lib/validation'
import { ValidationError } from '@/lib/validation'
import type { GenerateRequest, GenerateResponse } from '@/types'

export const runtime = 'edge'
export const preferredRegion = 'iad1'
export const maxDuration = 30

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    let body: GenerateRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid JSON in request body'),
        { status: 400 }
      )
    }

    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Prompt is required and must be a string'),
        { status: 400 }
      )
    }

    if (prompt.length < 10) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Prompt must be at least 10 characters'),
        { status: 400 }
      )
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Prompt must not exceed 5000 characters'),
        { status: 400 }
      )
    }

    // Initialize AI service
    const aiService = getAIService()

    if (!aiService.isConfigured()) {
      return NextResponse.json(
        createErrorResponse('AI_ERROR', 'AI service is not configured. Check OPENAI_API_KEY.'),
        { status: 503 }
      )
    }

    // Execute with retry logic
    const retryResult = await retryOnFailure(
      () => aiService.generateApp(prompt),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 8000,
        backoffMultiplier: 2,
      }
    )

    if (!retryResult.success) {
      const error = retryResult.error
      const errorMessage = error?.message || 'Unknown error during generation'

      // Determine error type
      if (error instanceof ValidationError) {
        return NextResponse.json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'AI returned invalid response structure',
            errorMessage
          ),
          { status: 422 }
        )
      }

      if (errorMessage.toLowerCase().includes('timeout')) {
        return NextResponse.json(
          createErrorResponse('TIMEOUT', 'Request timed out', errorMessage),
          { status: 504 }
        )
      }

      return NextResponse.json(
        createErrorResponse(
          'MAX_RETRIES_EXCEEDED',
          'Failed to generate after maximum retry attempts',
          errorMessage
        ),
        { status: 502 }
      )
    }

    const latencyMs = Date.now() - startTime

    // Return success response
    const successResponse: GenerateResponse = {
      success: true,
      data: retryResult.data!,
      retries: retryResult.attempts - 1,
      latencyMs,
    }

    return NextResponse.json(successResponse, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      createErrorResponse('UNKNOWN', 'An unexpected error occurred', errorMessage),
      { status: 500 }
    )
  }
}

// Handle GET requests with a helpful message
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      message: 'AI App Generation API',
      usage: 'Send POST request with { "prompt": "your app description" }',
      example: { prompt: 'Build a todo app with user authentication' },
    },
    { status: 200 }
  )
}
