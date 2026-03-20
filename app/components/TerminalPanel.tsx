'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { 
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTerminalSession, executeCommand } from '@/lib/terminal-service'
import type { Project } from '@/types/project'
import type { TerminalSession, CommandResult } from '@/types/terminal'

import '@xterm/xterm/css/xterm.css'

export function TerminalPanel({ project, isVisible }: { project: Project | null; isVisible: boolean }) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [session, setSession] = useState<TerminalSession | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Initialize terminal
  useEffect(() => {
    if (!isVisible || !terminalRef.current) return
    
    const term = new XTerm({
      theme: {
        background: '#18181b',
        foreground: '#a1a1aa',
        cursor: '#f59e0b',
        selectionBackground: '#3f3f46',
        black: '#18181b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#a1a1aa',
        brightBlack: '#52525b',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f4f4f5',
      },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
    })
    
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    
    term.open(terminalRef.current)
    fitAddon.fit()
    
    xtermRef.current = term
    fitAddonRef.current = fitAddon
    
    // Create session
    const newSession = createTerminalSession(project)
    setSession(newSession)
    
    // Initial prompt
    writePrompt(term, newSession)
    
    // Handle input
    let currentLine = ''
    
    term.onData((data) => {
      const code = data.charCodeAt(0)
      
      // Enter key
      if (code === 13) {
        term.write('\r\n')
        
        if (currentLine.trim()) {
          executeCommand(currentLine, newSession).then((result) => {
            if (result.output) {
              // Handle clear command
              if (result.output.includes('\x1b[2J')) {
                term.clear()
              } else {
                const lines = result.output.split('\n')
                lines.forEach((line, i) => {
                  if (i > 0) term.write('\r\n')
                  term.write(line)
                })
              }
            }
            term.write('\r\n')
            writePrompt(term, newSession)
          })
        } else {
          writePrompt(term, newSession)
        }
        
        currentLine = ''
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
        term.write('^C\r\n')
        currentLine = ''
        writePrompt(term, newSession)
      }
      // Ctrl+L (clear)
      else if (code === 12) {
        term.clear()
        writePrompt(term, newSession)
      }
      // Regular character
      else if (code >= 32 && code !== 127) {
        currentLine += data
        term.write(data)
      }
    })
    
    // Handle resize
    const handleResize = () => {
      fitAddon.fit()
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [isVisible, project])
  
  const writePrompt = (term: XTerm, session: TerminalSession) => {
    const prompt = `\x1b[32mdeveloper\x1b[0m:\x1b[34m${session.cwd}\x1b[0m$ `
    term.write(prompt)
  }
  
  const clearTerminal = () => {
    xtermRef.current?.clear()
  }
  
  const copyTerminal = () => {
    const selection = xtermRef.current?.getSelection()
    if (selection) {
      navigator.clipboard.writeText(selection)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  if (!isVisible) return null
  
  return (
    <div className={cn(
      'flex flex-col bg-zinc-950',
      isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-300">Terminal</span>
          <span className="text-xs text-zinc-600">|</span>
          <span className="text-xs text-zinc-500">{session?.cwd}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyTerminal}
            className="p-1.5 text-zinc-500 hover:text-zinc-300"
            title="Copy selection"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={clearTerminal}
            className="p-1.5 text-zinc-500 hover:text-zinc-300"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}