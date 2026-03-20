export type PipelineStatus = 'idle' | 'running' | 'success' | 'failed' | 'cancelled'
export type TriggerType = 'manual' | 'git_push' | 'schedule' | 'webhook'

export interface Pipeline {
  id: string
  projectId: string
  name: string
  config: PipelineConfig
  status: PipelineStatus
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

export interface PipelineConfig {
  trigger: TriggerType
  branch: string
  steps: PipelineStep[]
  environmentVariables: Record<string, string>
  notificationChannels?: string[]
  autoDeploy: boolean
  requireApproval: boolean
}

export interface PipelineStep {
  id: string
  name: string
  type: 'build' | 'test' | 'lint' | 'deploy' | 'custom'
  command?: string
  dependsOn?: string[]
  timeoutMinutes: number
  continueOnError: boolean
  artifacts?: string[]
}

export interface PipelineRun {
  id: string
  pipelineId: string
  status: PipelineStatus
  trigger: TriggerType
  commitSha?: string
  commitMessage?: string
  branch: string
  startedAt: string
  completedAt?: string
  durationMs?: number
  steps: PipelineStepRun[]
  logs: PipelineLog[]
  artifacts?: PipelineArtifact[]
  errorMessage?: string
}

export interface PipelineStepRun {
  stepId: string
  status: PipelineStatus
  startedAt?: string
  completedAt?: string
  durationMs?: number
  logs: string[]
  errorMessage?: string
}

export interface PipelineLog {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  stepId?: string
}

export interface PipelineArtifact {
  id: string
  name: string
  path: string
  size: number
  url: string
  createdAt: string
}

export interface DeploymentTarget {
  id: string
  name: string
  type: 'vercel' | 'netlify' | 'aws' | 'custom'
  config: Record<string, unknown>
}

export interface GitConnection {
  id: string
  provider: 'github' | 'gitlab' | 'bitbucket'
  repoFullName: string
  defaultBranch: string
  webhookSecret: string
  isConnected: boolean
  lastSyncAt?: string
}
