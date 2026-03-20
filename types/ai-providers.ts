export type AIProvider = 'openai' | 'openrouter' | 'groq' | 'gemini' | 'auto'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model: string
  maxTokens: number
  temperature: number
  priority: number // Lower = tried first
}

export interface FreeModel {
  provider: AIProvider
  model: string
  contextWindow: number
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  capabilities: string[]
  costPer1KTokens: number // Usually 0 for free
}

export const FREE_MODELS: FreeModel[] = [
  // OpenRouter Free Models
  {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    contextWindow: 128000,
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 200 },
    capabilities: ['chat', 'code', 'analysis'],
    costPer1KTokens: 0
  },
  {
    provider: 'openrouter',
    model: 'nousresearch/hermes-3-llama-3.1-405b:free',
    contextWindow: 128000,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 100 },
    capabilities: ['chat', 'code', 'analysis', 'long-context'],
    costPer1KTokens: 0
  },
  {
    provider: 'openrouter',
    model: 'qwen/qwen-2.5-72b-instruct:free',
    contextWindow: 32768,
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 200 },
    capabilities: ['chat', 'code', 'analysis'],
    costPer1KTokens: 0
  },
  {
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat:free',
    contextWindow: 64000,
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 200 },
    capabilities: ['chat', 'code', 'analysis', 'coding-expert'],
    costPer1KTokens: 0
  },
  {
    provider: 'openrouter',
    model: 'google/gemini-flash-1.5:free',
    contextWindow: 1000000,
    rateLimit: { requestsPerMinute: 15, requestsPerDay: 150 },
    capabilities: ['chat', 'code', 'analysis', 'multimodal', 'long-context'],
    costPer1KTokens: 0
  },
  {
    provider: 'openrouter',
    model: 'mistralai/mistral-7b-instruct:free',
    contextWindow: 32768,
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 200 },
    capabilities: ['chat', 'code'],
    costPer1KTokens: 0
  },
  
  // Groq Free Models (very fast)
  {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    contextWindow: 128000,
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 14400 },
    capabilities: ['chat', 'code', 'fast-generation'],
    costPer1KTokens: 0
  },
  {
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    contextWindow: 128000,
    rateLimit: { requestsPerMinute: 15, requestsPerDay: 14400 },
    capabilities: ['chat', 'code', 'analysis'],
    costPer1KTokens: 0
  },
  {
    provider: 'groq',
    model: 'mixtral-8x7b-32768',
    contextWindow: 32768,
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 14400 },
    capabilities: ['chat', 'code', 'analysis'],
    costPer1KTokens: 0
  },
  {
    provider: 'groq',
    model: 'gemma2-9b-it',
    contextWindow: 8192,
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 14400 },
    capabilities: ['chat', 'code'],
    costPer1KTokens: 0
  },
  
  // Gemini Free Models
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    contextWindow: 1000000,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 1500 },
    capabilities: ['chat', 'code', 'analysis', 'multimodal', 'long-context'],
    costPer1KTokens: 0
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash-8b',
    contextWindow: 1000000,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 1500 },
    capabilities: ['chat', 'code', 'fast', 'long-context'],
    costPer1KTokens: 0
  },
  {
    provider: 'gemini',
    model: 'gemini-1.0-pro',
    contextWindow: 32000,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 1500 },
    capabilities: ['chat', 'code'],
    costPer1KTokens: 0
  },
]

// Cost-optimized fallback chain
export const MODEL_FALLBACK_CHAIN: AIProviderConfig[] = [
  // Try fastest free models first
  { provider: 'groq', apiKey: process.env.GROQ_API_KEY || '', model: 'llama-3.1-8b-instant', maxTokens: 4096, temperature: 0.7, priority: 1 },
  { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY || '', model: 'gemini-1.5-flash-8b', maxTokens: 8192, temperature: 0.7, priority: 2 },
  { provider: 'openrouter', apiKey: process.env.OPENROUTER_API_KEY || '', model: 'meta-llama/llama-3.1-8b-instruct:free', maxTokens: 4096, temperature: 0.7, priority: 3 },
  // Higher quality if needed
  { provider: 'groq', apiKey: process.env.GROQ_API_KEY || '', model: 'llama-3.1-70b-versatile', maxTokens: 4096, temperature: 0.7, priority: 4 },
  { provider: 'openrouter', apiKey: process.env.OPENROUTER_API_KEY || '', model: 'deepseek/deepseek-chat:free', maxTokens: 8192, temperature: 0.7, priority: 5 },
  // Long context
  { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY || '', model: 'gemini-1.5-flash', maxTokens: 8192, temperature: 0.7, priority: 6 },
  { provider: 'openrouter', apiKey: process.env.OPENROUTER_API_KEY || '', model: 'google/gemini-flash-1.5:free', maxTokens: 8192, temperature: 0.7, priority: 7 },
  // Premium fallback (paid)
  { provider: 'openai', apiKey: process.env.OPENAI_API_KEY || '', model: 'gpt-4-turbo-preview', maxTokens: 4096, temperature: 0.7, priority: 100 },
]
