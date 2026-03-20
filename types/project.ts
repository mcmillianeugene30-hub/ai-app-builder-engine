export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: 'frontend' | 'backend' | 'database' | 'config' | 'other'
  language: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  files: ProjectFile[]
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  files: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>[]
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  files?: ProjectFile[]
}

export interface ProjectListItem {
  id: string
  name: string
  description?: string
  fileCount: number
  createdAt: string
  updatedAt: string
}

// Database schema types
export interface DatabaseProject {
  id: string
  user_id: string
  name: string
  description: string | null
  files: DatabaseProjectFile[]
  created_at: string
  updated_at: string
}

export interface DatabaseProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: string
  language: string
  created_at: string
  updated_at: string
}

// Component props
export interface ProjectSidebarProps {
  projects: ProjectListItem[]
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onCreateProject: () => void
  onDeleteProject: (projectId: string) => void
  loading?: boolean
}

export interface FileExplorerProps {
  files: ProjectFile[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
  onCreateFile?: () => void
  onDeleteFile?: (fileId: string) => void
}

export interface FileViewerProps {
  file: ProjectFile | null
  readOnly?: boolean
  onChange?: (content: string) => void
  onSave?: () => void
}
