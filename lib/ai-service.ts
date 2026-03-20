import OpenAI from 'openai'
import type { AIProviderConfig, AppGenerationOutput } from '@/types'
import { extractJSONFromResponse, validateJSON, ValidationError } from './validation'

const SYSTEM_PROMPT = `You are an expert full-stack developer and architect. 
Your task is to generate complete, production-ready code for web applications based on user prompts.

RESPONSE FORMAT:
You must return ONLY a valid JSON object with this exact structure:
{
  "frontend": "Complete frontend code with React/Vue/Next.js components, hooks, styles, and state management",
  "backend": "Complete backend API routes, controllers, services, and middleware",
  "database": "Complete database schema, migrations, models, and queries"
}

RULES:
1. All three fields (frontend, backend, database) are REQUIRED and must contain complete, working code
2. Code should be production-ready with proper error handling, types, and comments
3. Do not include markdown formatting - return pure JSON
4. Ensure all code is syntactically correct and follows best practices
5. For the frontend, include full component implementations with imports
6. For the backend, include complete API route handlers with proper HTTP methods
7. For the database, include SQL schemas or ORM model definitions with relationships

Generate the most appropriate tech stack based on the requirements. Default to:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Next.js API routes or Express.js
- Database: PostgreSQL with Prisma ORM or raw SQL`;

export class AIService {
  private client: OpenAI
  private config: AIProviderConfig

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.config = {
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.2,
      maxTokens: 4000,
      timeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeoutMs,
    })
  }

  /**
   * Generates full-stack app code from a user prompt
   * @param prompt - User's app description
   * @returns Generated code for frontend, backend, and database
   */
  async generateApp(prompt: string): Promise<AppGenerationOutput> {
    const startTime = Date.now()
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      })

      const rawContent = completion.choices[0]?.message?.content
      
      if (!rawContent) {
        throw new Error('Empty response from AI')
      }

      // Parse and validate the response
      const parsed = extractJSONFromResponse(rawContent)
      const validated = validateJSON(parsed)

      return validated
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      
      if (error instanceof OpenAI.APIError) {
        throw new Error(`AI API error: ${error.message} (Status: ${error.status})`)
      }
      
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validates if the AI service is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService()
  }
  return aiServiceInstance
}

export function resetAIService(): void {
  aiServiceInstance = null
}
