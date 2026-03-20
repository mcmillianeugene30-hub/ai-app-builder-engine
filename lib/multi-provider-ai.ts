import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, AIProviderConfig, FreeModel } from '@/types/ai-providers'
import { FREE_MODELS, MODEL_FALLBACK_CHAIN } from '@/types/ai-providers'

interface GenerateOptions {
  prompt: string
  systemPrompt?: string
  provider?: AIProvider
  model?: string
  maxRetries?: number
  timeoutMs?: number
}

interface GenerateResult {
  content: string
  provider: AIProvider
  model: string
  tokensUsed: number
  cost: number
  duration: number
  cached?: boolean
}

interface ProviderStatus {
  provider: AIProvider
  available: boolean
  lastError?: string
  lastUsedAt?: string
  requestCount: number
  errorCount: number
}

// Provider clients
const clients: Record<string, any> = {}

// Rate limit tracking
const rateLimits = new Map<string, { count: number; resetAt: number }>()

// Initialize clients
function getOpenAIClient() {
  if (!clients.openai) {
    clients.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return clients.openai
}

function getGroqClient() {
  if (!clients.groq) {
    clients.groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  }
  return clients.groq
}

function getOpenRouterClient() {
  if (!clients.openrouter) {
    clients.openrouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    })
  }
  return clients.openrouter
}

function getGeminiClient() {
  if (!clients.gemini) {
    clients.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  }
  return clients.gemini
}

// Check rate limit
function checkRateLimit(provider: AIProvider, model: string): boolean {
  const key = `${provider}:${model}`
  const limit = rateLimits.get(key)
  
  if (!limit) {
    rateLimits.set(key, { count: 1, resetAt: Date.now() + 60000 })
    return true
  }
  
  if (Date.now() > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: Date.now() + 60000 })
    return true
  }
  
  const modelInfo = FREE_MODELS.find(m => m.provider === provider && m.model === model)
  if (!modelInfo) return true
  
  if (limit.count >= modelInfo.rateLimit.requestsPerMinute) {
    return false
  }
  
  limit.count++
  return true
}

// Generate with single provider
async function generateWithProvider(
  config: AIProviderConfig,
  prompt: string,
  systemPrompt?: string
): Promise<GenerateResult | null> {
  const startTime = Date.now()
  
  try {
    // Check rate limit
    if (!checkRateLimit(config.provider, config.model)) {
      throw new Error(`Rate limit exceeded for ${config.provider}:${config.model}`)
    }
    
    let content: string
    let tokensUsed: number
    
    switch (config.provider) {
      case 'openai':
      case 'groq':
      case 'openrouter': {
        const client = config.provider === 'openai' 
          ? getOpenAIClient() 
          : config.provider === 'groq'
            ? getGroqClient()
            : getOpenRouterClient()
        
        const response = await client.chat.completions.create({
          model: config.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        })
        
        content = response.choices[0]?.message?.content || ''
        tokensUsed = response.usage?.total_tokens || 0
        break
      }
      
      case 'gemini': {
        const client = getGeminiClient()
        const model = client.getGenerativeModel({ model: config.model })
        
        const result = await model.generateContent({
          contents: [
            ...(systemPrompt ? [{ role: 'user', parts: [{ text: systemPrompt }] }] : []),
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature,
          }
        })
        
        content = result.response.text()
        tokensUsed = result.response.usageMetadata?.totalTokenCount || 0
        break
      }
      
      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
    
    const duration = Date.now() - startTime
    
    return {
      content,
      provider: config.provider,
      model: config.model,
      tokensUsed,
      cost: 0, // Free models
      duration,
    }
    
  } catch (error) {
    console.error(`Generation failed with ${config.provider}:${config.model}:`, error)
    return null
  }
}

// Main generate function with fallback chain
export async function generateWithFallback(
  options: GenerateOptions
): Promise<GenerateResult> {
  const { prompt, systemPrompt, maxRetries = 3, timeoutMs = 30000 } = options
  
  // Sort by priority
  const configs = [...MODEL_FALLBACK_CHAIN].sort((a, b) => a.priority - b.priority)
  
  // Filter out paid models unless explicitly requested
  if (options.provider !== 'openai') {
    configs.filter(c => c.priority < 100)
  }
  
  // Try each provider in order
  for (const config of configs) {
    if (options.provider && config.provider !== options.provider) continue
    if (options.model && config.model !== options.model) continue
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await Promise.race([
        generateWithProvider(config, prompt, systemPrompt),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]).catch(() => null)
      
      if (result) {
        console.log(`✅ Generated with ${result.provider}:${result.model} in ${result.duration}ms`)
        return result
      }
      
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  
  throw new Error('All AI providers failed')
}

// Batch generation for efficiency
export async function generateBatch(
  prompts: string[],
  systemPrompt?: string,
  provider?: AIProvider
): Promise<GenerateResult[]> {
  // Use fastest provider for batches
  const preferredProvider = provider || 'groq'
  const configs = MODEL_FALLBACK_CHAIN.filter(c => c.provider === preferredProvider)
  
  const results: GenerateResult[] = []
  
  for (const prompt of prompts) {
    try {
      const result = await generateWithFallback({
        prompt,
        systemPrompt,
        provider: configs[0]?.provider,
        model: configs[0]?.model,
      })
      results.push(result)
    } catch (error) {
      console.error(`Batch generation failed for prompt:`, error)
      results.push(null as any)
    }
    
    // Small delay between requests to respect rate limits
    await new Promise(r => setTimeout(r, 100))
  }
  
  return results
}

// Get provider status
export function getProviderStatus(): ProviderStatus[] {
  const providers: AIProvider[] = ['openai', 'groq', 'gemini', 'openrouter']
  
  return providers.map(provider => {
    const apiKey = getApiKey(provider)
    return {
      provider,
      available: !!apiKey,
      requestCount: 0,
      errorCount: 0,
    }
  })
}

function getApiKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case 'openai': return process.env.OPENAI_API_KEY
    case 'groq': return process.env.GROQ_API_KEY
    case 'gemini': return process.env.GEMINI_API_KEY
    case 'openrouter': return process.env.OPENROUTER_API_KEY
    default: return undefined
  }
}

// Cost estimation (even for free models, track theoretical cost)
export function estimateCost(tokens: number, provider: AIProvider): number {
  const costPer1K = FREE_MODELS.find(m => m.provider === provider)?.costPer1KTokens || 0
  return (tokens / 1000) * costPer1K
}

// Export provider info
export function getAvailableProviders(): AIProvider[] {
  return MODEL_FALLBACK_CHAIN
    .filter(c => getApiKey(c.provider))
    .map(c => c.provider)
    .filter((v, i, a) => a.indexOf(v) === i)
}

export function getFreeModels(): FreeModel[] {
  return FREE_MODELS
}
