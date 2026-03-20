export interface GitConfig {
  owner: string
  repo: string
  branch: string
  token: string
}

export interface GitCommitRequest {
  message: string
  files: GitFileChange[]
  branch?: string
}

export interface GitFileChange {
  path: string
  content: string
  operation: 'create' | 'update' | 'delete'
}

export interface GitCommitResponse {
  success: boolean
  sha: string | null
  url: string | null
  error: string | null
}

export interface GitRepoRequest {
  name: string
  description: string
  isPrivate: boolean
  files: GitFileChange[]
}

export interface GitRepoResponse {
  success: boolean
  repoUrl: string | null
  cloneUrl: string | null
  error: string | null
}

export interface GitStatus {
  isConnected: boolean
  username: string | null
  avatarUrl: string | null
  repos: GitRepo[]
}

export interface GitRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  htmlUrl: string
  defaultBranch: string
  updatedAt: string
}

export interface GitPanelProps {
  project: Project | null
  isVisible: boolean
  onConnect: () => void
  onCommit: (request: GitCommitRequest) => void
  onCreateRepo: (request: GitRepoRequest) => void
}
