import type { Project } from './project'

export type ExportFormat = 'zip' | 'vercel' | 'github' | 'codesandbox' | 'stackblitz'

export interface ExportConfig {
  format: ExportFormat
  project: Project
  options?: ExportOptions
}

export interface ExportOptions {
  includeNodeModules: boolean
  minify: boolean
  includeSourceMaps: boolean
}

export interface ExportResult {
  success: boolean
  url?: string
  downloadUrl?: string
  error?: string
  logs: string[]
}

export interface VercelDeployConfig {
  projectName: string
  files: Record<string, string>
  framework: 'nextjs' | 'react' | 'vue' | 'svelte' | 'other'
  buildCommand?: string
  outputDirectory?: string
  installCommand?: string
}

export interface VercelDeployResult {
  success: boolean
  deploymentUrl: string | null
  projectUrl: string | null
  error?: string
}

export interface ZipExportResult {
  success: boolean
  blob: Blob | null
  logs: string[]
  filename: string
  error?: string
}

export interface ExportPanelProps {
  project: Project | null
  isVisible: boolean
  onExport: (format: ExportFormat) => void
}
