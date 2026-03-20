import type { 
  TerminalSession, 
  VirtualFileSystem, 
  VirtualDirectory, 
  VirtualFile,
  VirtualNode,
  CommandResult,
  CommandHandler 
} from '@/types/terminal'
import type { Project, ProjectFile } from '@/types/project'

export function createTerminalSession(project: Project | null): TerminalSession {
  const fileSystem = createVirtualFileSystem(project)
  
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cwd: '/',
    env: {
      HOME: '/home/user',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      NODE_ENV: 'development',
      SHELL: '/bin/bash',
    },
    history: [],
    fileSystem,
  }
}

function createVirtualFileSystem(project: Project | null): VirtualFileSystem {
  const root: VirtualDirectory = {
    name: '/',
    type: 'directory',
    children: new Map(),
    createdAt: new Date(),
    modifiedAt: new Date(),
  }
  
  if (project) {
    project.files.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean)
      let current = root
      
      // Create directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        let child = current.children.get(part)
        
        if (!child) {
          child = {
            name: part,
            type: 'directory',
            children: new Map(),
            createdAt: new Date(),
            modifiedAt: new Date(),
          }
          current.children.set(part, child as VirtualNode)
        }
        
        if (child.type === 'directory') {
          current = child
        }
      }
      
      // Create file
      const fileName = pathParts[pathParts.length - 1]
      const newFile: VirtualFile = {
        name: fileName,
        type: 'file',
        content: file.content,
        createdAt: new Date(file.createdAt),
        modifiedAt: new Date(file.updatedAt),
      }
      current.children.set(fileName, newFile as VirtualNode)
    })
  }
  
  return { root }
}

const commandHandlers: Record<string, CommandHandler> = {
  help: {
    name: 'help',
    description: 'Show available commands',
    usage: 'help',
    execute: async () => ({
      output: Object.values(commandHandlers)
        .map(cmd => `  ${cmd.name.padEnd(12)} - ${cmd.description}`)
        .join('\n'),
      exitCode: 0,
      isError: false,
    }),
  },
  
  clear: {
    name: 'clear',
    description: 'Clear the terminal screen',
    usage: 'clear',
    execute: async () => ({
      output: '\x1b[2J\x1b[H', // ANSI clear screen
      exitCode: 0,
      isError: false,
    }),
  },
  
  ls: {
    name: 'ls',
    description: 'List directory contents',
    usage: 'ls [path]',
    execute: async (args, session) => {
      const path = args[0] || session.cwd
      const node = resolvePath(session.fileSystem.root, path)
      
      if (!node) {
        return { output: `ls: cannot access '${path}': No such file or directory`, exitCode: 1, isError: true }
      }
      
      if (node.type === 'file') {
        return { output: node.name, exitCode: 0, isError: false }
      }
      
      const entries = Array.from(node.children.values())
      const output = entries
        .map(entry => {
          if (entry.type === 'directory') {
            return `\x1b[34m${entry.name}\x1b[0m` // Blue for directories
          }
          return entry.name
        })
        .join('  ')
      
      return { output: output || '(empty)', exitCode: 0, isError: false }
    },
  },
  
  cd: {
    name: 'cd',
    description: 'Change directory',
    usage: 'cd <directory>',
    execute: async (args, session) => {
      if (args.length === 0) {
        session.cwd = '/'
        return { output: '', exitCode: 0, isError: false }
      }
      
      const path = resolveAbsolutePath(session.cwd, args[0])
      const node = resolvePath(session.fileSystem.root, path)
      
      if (!node) {
        return { output: `cd: no such file or directory: ${args[0]}`, exitCode: 1, isError: true }
      }
      
      if (node.type === 'file') {
        return { output: `cd: not a directory: ${args[0]}`, exitCode: 1, isError: true }
      }
      
      session.cwd = path
      return { output: '', exitCode: 0, isError: false }
    },
  },
  
  pwd: {
    name: 'pwd',
    description: 'Print working directory',
    usage: 'pwd',
    execute: async (_args, session) => ({
      output: session.cwd,
      exitCode: 0,
      isError: false,
    }),
  },
  
  cat: {
    name: 'cat',
    description: 'Display file contents',
    usage: 'cat <file>',
    execute: async (args, session) => {
      if (args.length === 0) {
        return { output: 'cat: missing file operand', exitCode: 1, isError: true }
      }
      
      const path = resolveAbsolutePath(session.cwd, args[0])
      const node = resolvePath(session.fileSystem.root, path)
      
      if (!node) {
        return { output: `cat: ${args[0]}: No such file or directory`, exitCode: 1, isError: true }
      }
      
      if (node.type === 'directory') {
        return { output: `cat: ${args[0]}: Is a directory`, exitCode: 1, isError: true }
      }
      
      return { output: node.content, exitCode: 0, isError: false }
    },
  },
  
  echo: {
    name: 'echo',
    description: 'Print text',
    usage: 'echo [text]',
    execute: async (args) => ({
      output: args.join(' '),
      exitCode: 0,
      isError: false,
    }),
  },
  
  mkdir: {
    name: 'mkdir',
    description: 'Create directory',
    usage: 'mkdir <directory>',
    execute: async (args, session) => {
      if (args.length === 0) {
        return { output: 'mkdir: missing operand', exitCode: 1, isError: true }
      }
      
      const path = resolveAbsolutePath(session.cwd, args[0])
      const parentPath = path.split('/').slice(0, -1).join('/') || '/'
      const dirName = path.split('/').pop()!
      
      const parent = resolvePath(session.fileSystem.root, parentPath)
      
      if (!parent || parent.type !== 'directory') {
        return { output: `mkdir: cannot create directory '${args[0]}': No such file or directory`, exitCode: 1, isError: true }
      }
      
      if (parent.children.has(dirName)) {
        return { output: `mkdir: cannot create directory '${args[0]}': File exists`, exitCode: 1, isError: true }
      }
      
      const newDir: VirtualDirectory = {
        name: dirName,
        type: 'directory',
        children: new Map(),
        createdAt: new Date(),
        modifiedAt: new Date(),
      }
      parent.children.set(dirName, newDir as VirtualNode)
      
      return { output: '', exitCode: 0, isError: false }
    },
  },
  
  touch: {
    name: 'touch',
    description: 'Create empty file',
    usage: 'touch <file>',
    execute: async (args, session) => {
      if (args.length === 0) {
        return { output: 'touch: missing file operand', exitCode: 1, isError: true }
      }
      
      const path = resolveAbsolutePath(session.cwd, args[0])
      const parentPath = path.split('/').slice(0, -1).join('/') || '/'
      const fileName = path.split('/').pop()!
      
      const parent = resolvePath(session.fileSystem.root, parentPath)
      
      if (!parent || parent.type !== 'directory') {
        return { output: `touch: cannot touch '${args[0]}': No such file or directory`, exitCode: 1, isError: true }
      }
      
      const newFile: VirtualFile = {
        name: fileName,
        type: 'file',
        content: '',
        createdAt: new Date(),
        modifiedAt: new Date(),
      }
      parent.children.set(fileName, newFile as VirtualNode)
      
      return { output: '', exitCode: 0, isError: false }
    },
  },
  
  whoami: {
    name: 'whoami',
    description: 'Print current user',
    usage: 'whoami',
    execute: async () => ({
      output: 'developer',
      exitCode: 0,
      isError: false,
    }),
  },
  
  date: {
    name: 'date',
    description: 'Print current date and time',
    usage: 'date',
    execute: async () => ({
      output: new Date().toString(),
      exitCode: 0,
      isError: false,
    }),
  },
  
  env: {
    name: 'env',
    description: 'Print environment variables',
    usage: 'env',
    execute: async (_args, session) => ({
      output: Object.entries(session.env)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n'),
      exitCode: 0,
      isError: false,
    }),
  },
  
  npm: {
    name: 'npm',
    description: 'Package manager (simulated)',
    usage: 'npm <command>',
    execute: async (args) => {
      const command = args[0]
      
      if (!command) {
        return { output: 'npm <command>\n\nUsage:\n  npm install\n  npm run dev\n  npm run build', exitCode: 0, isError: false }
      }
      
      if (command === 'install' || command === 'i') {
        return { output: 'added 128 packages in 2.3s\n\nfound 0 vulnerabilities', exitCode: 0, isError: false }
      }
      
      if (command === 'run' && args[1] === 'dev') {
        return { output: '> project@1.0.0 dev\n> next dev\n\nready - started server on 0.0.0.0:3000, url: http://localhost:3000', exitCode: 0, isError: false }
      }
      
      if (command === 'run' && args[1] === 'build') {
        return { output: '> project@1.0.0 build\n> next build\n\ninfo - Loaded env from .env.local\ninfo - Creating an optimized production build...\ninfo - Compiled successfully', exitCode: 0, isError: false }
      }
      
      return { output: `npm ${command} - simulated (no actual execution in browser)`, exitCode: 0, isError: false }
    },
  },
}

export async function executeCommand(
  commandLine: string,
  session: TerminalSession
): Promise<CommandResult> {
  const parts = commandLine.trim().split(/\s+/)
  const command = parts[0]
  const args = parts.slice(1)
  
  if (!command) {
    return { output: '', exitCode: 0, isError: false }
  }
  
  const handler = commandHandlers[command]
  
  if (!handler) {
    return { 
      output: `${command}: command not found`, 
      exitCode: 127, 
      isError: true 
    }
  }
  
  const result = await handler.execute(args, session)
  
  // Add to history
  session.history.push({
    command: commandLine,
    output: result.output,
    timestamp: new Date(),
    exitCode: result.exitCode,
  })
  
  return result
}

function resolvePath(root: VirtualDirectory, path: string): VirtualNode | null {
  if (path === '/' || path === '') return root
  
  const parts = path.split('/').filter(Boolean)
  let current: VirtualNode = root
  
  for (const part of parts) {
    if (current.type !== 'directory') return null
    const next = current.children.get(part)
    if (!next) return null
    current = next
  }
  
  return current
}

function resolveAbsolutePath(cwd: string, path: string): string {
  if (path.startsWith('/')) return path
  
  if (path === '.') return cwd
  if (path === '..') {
    const parts = cwd.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }
  
  const cwdParts = cwd === '/' ? [] : cwd.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  
  for (const part of pathParts) {
    if (part === '..') {
      cwdParts.pop()
    } else if (part !== '.') {
      cwdParts.push(part)
    }
  }
  
  return '/' + cwdParts.join('/')
}