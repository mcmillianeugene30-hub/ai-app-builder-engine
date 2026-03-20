export interface DeploymentFile {
  path: string
  content: string
}

export interface DeployConfig {
  name?: string
  projectId?: string
  env?: Record<string, string>
  public?: boolean
}

export type DeployStatus = 'idle' | 'preparing' | 'uploading' | 'building' | 'ready' | 'error'

export interface DeployState {
  status: DeployStatus
  url?: string
  deploymentId?: string
  error?: string
}

export interface DeployResult {
  success: boolean
  url?: string
  deploymentId?: string
  status?: DeployStatus
  error?: string
}

export interface DeployButtonProps {
  files: DeploymentFile[]
  projectName?: string
  onDeploy?: (url: string) => void
  disabled?: boolean
}

export interface DeploymentStatus {
  status: Exclude<DeployStatus, 'idle' | 'preparing' | 'uploading'>
  url?: string
  error?: string
}

export interface DeployStatusProps {
  deploymentId?: string
  initialUrl?: string
  onStatusChange?: (status: DeploymentStatus) => void
  className?: string
}
