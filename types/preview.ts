import type { ProjectFile } from './project'

export type PreviewFramework = 'react' | 'vue' | 'svelte' | 'html' | 'unknown'

export interface PreviewConfig {
  width: string | number
  height: string | number
  sandbox: 'allow-scripts' | 'allow-same-origin' | 'allow-popups' | 'allow-forms'
  refreshDebounceMs: number
}

export interface PreviewState {
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  framework: PreviewFramework
}

export interface PreviewWindowProps {
  files: ProjectFile[]
  activeFileId: string | null
  isVisible: boolean
  onError: (error: string) => void
  onLoad: () => void
}

export interface CodeBundle {
  html: string
  css: string
  javascript: string
  hasReact: boolean
  hasVue: boolean
  framework: PreviewFramework
}

export interface SanitizedCode {
  html: string
  css: string
  javascript: string
  warnings: string[]
  isSafe: boolean
}
