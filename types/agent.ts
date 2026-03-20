export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused'
export type AgentCapability = 'code_review' | 'refactor' | 'docs' | 'test' | 'optimize' | 'security' | 'accessibility'

export interface AIAgent {
  id: string
  name: string
  description: string
  capabilities: AgentCapability[]
  projectId: string
  status: AgentStatus
  config: AgentConfig
  schedule?: AgentSchedule
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

export interface AgentConfig {
  autoRun: boolean
  notifyOnComplete: boolean
  maxIterations: number
  contextFiles: string[]
  excludePatterns: string[]
  customInstructions?: string
}

export interface AgentSchedule {
  type: 'manual' | 'cron' | 'event'
  cronExpression?: string
  events?: string[]
  timezone: string
}

export interface AgentRun {
  id: string
  agentId: string
  status: AgentStatus
  startedAt: string
  completedAt?: string
  durationMs?: number
  tasks: AgentTask[]
  summary?: string
  changes: AgentChange[]
  logs: AgentLog[]
}

export interface AgentTask {
  id: string
  type: string
  description: string
  status: AgentStatus
  startedAt?: string
  completedAt?: string
  result?: unknown
}

export interface AgentChange {
  id: string
  filePath: string
  type: 'create' | 'modify' | 'delete'
  diff?: string
  applied: boolean
  appliedAt?: string
}

export interface AgentLog {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  taskId?: string
  metadata?: Record<string, unknown>
}
