import type { ProjectFile } from './project'

export interface OpenFile {
  file: ProjectFile
  isDirty: boolean
  isActive: boolean
}

export interface EditorState {
  openFiles: OpenFile[]
  activeFileId: string | null
}

export interface CodeEditorProps {
  file: ProjectFile | null
  value: string
  onChange: (value: string) => void
  onSave: () => void
  isDirty: boolean
  isSaving: boolean
  language: string
}

export interface TabsBarProps {
  openFiles: OpenFile[]
  activeFileId: string | null
  onSwitchFile: (fileId: string) => void
  onCloseFile: (fileId: string) => void
}

export interface FileListProps {
  files: ProjectFile[]
  openFileIds: string[]
  activeFileId: string | null
  onSelectFile: (file: ProjectFile) => void
}
