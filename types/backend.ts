import type { ProjectFile } from './project'

export interface BackendExecutionConfig {
  timeoutMs: number
  memoryLimitMB: number
  allowedModules: string[]
  blockedModules: string[]
}

export interface BackendExecutionRequest {
  files: ProjectFile[]
  entryPoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  body?: unknown
  headers?: Record<string, string>
}

export interface BackendExecutionResponse {
  success: boolean
  statusCode: number
  headers: Record<string, string | string[]>
  body: string | object
  executionTimeMs: number
  logs: string[]
  errors: string[]
}

export interface BackendSandboxState {
  isReady: boolean
  isBooting: boolean
  error: string | null
  bootProgress: number
}

export interface BackendExecutionProps {
  files: ProjectFile[]
  isVisible: boolean
  onError: (error: string) => void
  onExecution: (response: BackendExecutionResponse) => void
}

export interface BackendPanelProps {
  project: Project | null
  isVisible: boolean
}
