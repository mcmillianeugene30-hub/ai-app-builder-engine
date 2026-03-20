'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  Save, 
  Download, 
  Copy, 
  Check, 
  FileCode,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FileViewerProps, ProjectFile } from '@/types/project'

// Simple syntax highlighting for common languages
const languageColors: Record<string, string> = {
  typescript: 'text-blue-300',
  javascript: 'text-yellow-300',
  python: 'text-green-300',
  sql: 'text-purple-300',
  json: 'text-orange-300',
  markdown: 'text-pink-300',
  css: 'text-cyan-300',
  scss: 'text-cyan-300',
  html: 'text-red-300',
  yaml: 'text-gray-300',
  bash: 'text-lime-300',
  dotenv: 'text-gray-400',
}

const FileLanguageBadge = ({ language }: { language: string }) => (
  <span className={cn(
    'text-xs font-medium px-2 py-0.5 rounded',
    languageColors[language] || 'text-zinc-400',
    'bg-zinc-800'
  )}>
    {language}
  </span>
)

export function FileViewer({
  file,
  readOnly = false,
  onChange,
  onSave,
}: FileViewerProps) {
  const [content, setContent] = useState(file?.content || '')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync with external file changes
  useEffect(() => {
    if (file?.content !== undefined && file.content !== content) {
      setContent(file.content)
      setHasChanges(false)
    }
  }, [file?.id, file?.content])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setHasChanges(true)
    onChange?.(newContent)
  }, [onChange])

  const handleSave = useCallback(() => {
    onSave?.()
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2000)
  }, [onSave])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  const handleDownload = useCallback(() => {
    if (!file) return
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [content, file])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !readOnly) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, hasChanges, readOnly])

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <FileCode className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Select a file to view</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col bg-zinc-950 transition-all',
      isFullscreen ? 'fixed inset-0 z-50' : 'flex-1'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-zinc-400" />
          <div>
            <h3 className="text-sm font-medium text-zinc-200">{file.name}</h3>
            <p className="text-xs text-zinc-500">{file.path}</p>
          </div>
          <FileLanguageBadge language={file.language} />
          {hasChanges && !readOnly && (
            <span className="text-xs text-amber-400">• Modified</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              )}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <div className="w-px h-6 bg-zinc-700 mx-1" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={handleChange}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            'w-full h-full p-4 font-mono text-sm resize-none outline-none',
            'bg-zinc-950 text-zinc-300',
            'selection:bg-blue-500/30',
            readOnly && 'cursor-default'
          )}
          style={{
            tabSize: 2,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>{file.language}</span>
          <span>{content.split('\n').length} lines</span>
          <span>{content.length} chars</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{readOnly ? 'Read-only' : 'Editable'}</span>
        </div>
      </div>
    </div>
  )
}
