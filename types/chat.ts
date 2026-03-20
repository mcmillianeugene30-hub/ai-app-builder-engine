import type { ProjectFile } from './project'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
  isStreaming?: boolean
  attachments?: ChatAttachment[]
  codeBlocks?: ChatCodeBlock[]
}

export interface ChatAttachment {
  type: 'file'
  fileId: string
  fileName: string
  content: string
}

export interface ChatCodeBlock {
  language: string
  code: string
  filePath?: string
}

export interface ChatRequest {
  message: string
  context: {
    currentFile?: ProjectFile | null
    openFiles: ProjectFile[]
    projectContext?: string
  }
  history: ChatMessage[]
}

export interface ChatResponse {
  success: boolean
  message: ChatMessage | null
  error: string | null
}

export interface ChatPanelProps {
  project: Project | null
  currentFile: ProjectFile | null
  openFiles: ProjectFile[]
  isVisible: boolean
  onRequestEdit: (fileId: string, newContent: string) => void
}

export interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
}

export interface ChatMessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}
