import type { Terminal as XTermTerminal } from '@xterm/xterm'

export type TerminalCommand = 
  | 'help'
  | 'clear'
  | 'ls'
  | 'cd'
  | 'pwd'
  | 'cat'
  | 'echo'
  | 'npm'
  | 'node'
  | 'git'
  | 'mkdir'
  | 'touch'
  | 'rm'
  | 'cp'
  | 'mv'
  | 'whoami'
  | 'date'
  | 'env'
  | 'exit'
  | string

export interface TerminalSession {
  id: string
  cwd: string
  env: Record<string, string>
  history: TerminalCommandHistory[]
  fileSystem: VirtualFileSystem
}

export interface TerminalCommandHistory {
  command: string
  output: string
  timestamp: Date
  exitCode: number
}

export interface VirtualFileSystem {
  root: VirtualDirectory
}

export interface VirtualDirectory {
  name: string
  type: 'directory'
  children: Map<string, VirtualNode>
  createdAt: Date
  modifiedAt: Date
}

export interface VirtualFile {
  name: string
  type: 'file'
  content: string
  createdAt: Date
  modifiedAt: Date
}

export type VirtualNode = VirtualDirectory | VirtualFile

export interface TerminalProps {
  project: Project | null
  isVisible: boolean
  onExecuteCommand: (command: string) => Promise<string>
}

export interface TerminalPanelProps {
  session: TerminalSession
  isVisible: boolean
  onCommand: (command: string) => void
  onClear: () => void
}

export interface CommandResult {
  output: string
  exitCode: number
  isError: boolean
}

export interface CommandHandler {
  name: string
  description: string
  usage: string
  execute: (args: string[], session: TerminalSession) => Promise<CommandResult>
}
