'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { cn } from '@/lib/utils'
import type { TerminalSession } from '@/types/terminal'

interface TerminalPanelProps {
  className?: string
  projectId?: string
}

export function TerminalPanel({ className, projectId }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [session, setSession] = useState<TerminalSession>({
    id: 'local',
    cwd: '/project',
    history: [],
    env: { PATH: '/usr/local/bin:/usr/bin:/bin' },
    fileSystem: {
      root: {
        name: '/',
        type: 'directory',
        children: new Map(),
        createdAt: new Date(),
        modifiedAt: new Date()
      }
    }
  })

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const term = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: '#58a6ff40',
        black: '#010409',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#f778ba',
        cyan: '#39c5cf',
        white: '#e6edf3',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#ff9bce',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff'
      },
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    // Welcome message
    term.writeln('\x1b[1;34m🚀 AI App Builder Terminal\x1b[0m')
    term.writeln('\x1b[90mType \x1b[0m\x1b[32mhelp\x1b[0m\x1b[90m for available commands\x1b[0m')
    term.writeln('')
    term.write(`\x1b[32m➜\x1b[0m \x1b[34m${session.cwd}\x1b[0m `)

    // Handle input
    let currentLine = ''
    term.onData((data) => {
      const code = data.charCodeAt(0)

      // Enter key
      if (code === 13) {
        term.writeln('')
        handleCommand(currentLine, term)
        currentLine = ''
        term.write(`\x1b[32m➜\x1b[0m \x1b[34m${session.cwd}\x1b[0m `)
      }
      // Backspace
      else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1)
          term.write('\b \b')
        }
      }
      // Ctrl+C
      else if (code === 3) {
        term.writeln('')
        term.write(`\x1b[32m➜\x1b[0m \x1b[34m${session.cwd}\x1b[0m `)
        currentLine = ''
      }
      // Regular character
      else if (code >= 32 && code <= 126) {
        currentLine += data
        term.write(data)
      }
    })

    xtermRef.current = term
    fitAddonRef.current = fitAddon
    setIsReady(true)

    return () => {
      term.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCommand = (cmd: string, term: Terminal) => {
    const trimmed = cmd.trim()
    
    if (!trimmed) return

    // Add to history
    setSession(prev => ({
      ...prev,
      history: [...prev.history, { command: trimmed, output: '', timestamp: new Date(), exitCode: 0 }]
    }))

    const [command, ...args] = trimmed.split(' ')

    switch (command) {
      case 'help':
        term.writeln('\x1b[1mAvailable commands:\x1b[0m')
        term.writeln('  \x1b[32mls\x1b[0m        List files')
        term.writeln('  \x1b[32mcd\x1b[0m <dir>  Change directory')
        term.writeln('  \x1b[32mpwd\x1b[0m       Print working directory')
        term.writeln('  \x1b[32mcat\x1b[0m <file> Show file contents')
        term.writeln('  \x1b[32mnpm\x1b[0m       Run npm commands')
        term.writeln('  \x1b[32mgit\x1b[0m       Git operations')
        term.writeln('  \x1b[32mclear\x1b[0m     Clear terminal')
        term.writeln('  \x1b[32mhelp\x1b[0m      Show this help')
        break

      case 'clear':
      case 'cls':
        term.clear()
        break

      case 'ls':
        term.writeln('\x1b[34mapp\x1b[0m/       \x1b[34mcomponents\x1b[0m/  \x1b[34mlib\x1b[0m/')
        term.writeln('\x1b[34mnode_modules\x1b[0m/  \x1b[34mpublic\x1b[0m/  \x1b[34msupabase\x1b[0m/')
        term.writeln('\x1b[32mpackage.json\x1b[0m  \x1b[32mtsconfig.json\x1b[0m  \x1b[32mREADME.md\x1b[0m')
        break

      case 'pwd':
        term.writeln(session.cwd)
        break

      case 'cd':
        if (args[0]) {
          setSession(prev => ({ ...prev, cwd: args[0] }))
          term.writeln(`Changed to ${args[0]}`)
        }
        break

      case 'cat':
        if (args[0]) {
          term.writeln(`\x1b[90m// Contents of ${args[0]}\x1b[0m`)
          term.writeln('\x1b[33m// File viewing not implemented in demo\x1b[0m')
        } else {
          term.writeln('\x1b[31mUsage: cat <filename>\x1b[0m')
        }
        break

      case 'npm':
        term.writeln(`\x1b[90m> npm ${args.join(' ')}\x1b[0m`)
        term.writeln('\x1b[33m// npm operations would run here\x1b[0m')
        break

      case 'git':
        term.writeln(`\x1b[90m> git ${args.join(' ')}\x1b[0m`)
        term.writeln('\x1b[33m// git operations would run here\x1b[0m')
        break

      default:
        term.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`)
        term.writeln('Type \x1b[32mhelp\x1b[0m for available commands')
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#0d1117] rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-sm text-gray-400">Terminal</span>
        </div>
        <span className="text-xs text-gray-500">
          {session.cwd}
        </span>
      </div>

      {/* Terminal */}
      <div className="flex-1 p-2 overflow-hidden">
        <div ref={terminalRef} className="h-full" />
      </div>

      {/* Status */}
      <div className="px-3 py-1.5 bg-[#161b22] border-t border-[#30363d] text-xs text-gray-500 flex items-center justify-between">
        <span>{isReady ? '● Connected' : '○ Connecting...'}</span>
        <span>bash</span>
      </div>
    </div>
  )
}