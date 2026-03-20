'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { 
  Save, 
  Undo, 
  Redo, 
  Download, 
  Check, 
  Loader2,
  Maximize2,
  Minimize2,
  Type,
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CodeEditorProps } from '@/types/editor'

type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black'

export function CodeEditor({
  file,
  value,
  onChange,
  onSave,
  isDirty,
  isSaving,
  language,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const [theme, setTheme] = useState<EditorTheme>('vs-dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [showMinimap, setShowMinimap] = useState(true)

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave()
    })
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('', 'undo', null)
    })
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('', 'redo', null)
    })
  }, [onSave])

  // Handle content change
  const handleChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue)
    }
  }, [onChange])

  // Download file
  const handleDownload = useCallback(() => {
    if (!file) return
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [file, value])

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
        <div className="text-center">
          <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a file to edit</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col bg-zinc-900",
      isFullscreen ? "fixed inset-0 z-50" : "h-full"
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400 font-mono">
            {file.path}
          </span>
          {isDirty && (
            <span className="text-xs text-amber-400">●</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Font size control */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => setFontSize(s => Math.max(10, s - 1))}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-xs text-zinc-500 w-6 text-center">{fontSize}px</span>
            <button
              onClick={() => setFontSize(s => Math.min(24, s + 1))}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'vs-dark' ? 'vs-light' : 'vs-dark')}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
            title="Toggle theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Minimap toggle */}
          <button
            onClick={() => setShowMinimap(m => !m)}
            className={cn(
              "p-1.5 rounded",
              showMinimap 
                ? "text-blue-400 bg-blue-400/10" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            )}
            title="Toggle minimap"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="18" rx="1" />
            </svg>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(f => !f)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Save */}
          <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
              isDirty 
                ? "bg-blue-600 hover:bg-blue-500 text-white" 
                : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isDirty ? (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize,
            minimap: { enabled: showMinimap },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: true,
            snippetSuggestions: 'top',
            parameterHints: { enabled: true },
            hover: { enabled: true },
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            autoIndent: 'full',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
          loading={
            <div className="h-full flex items-center justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          }
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800 bg-zinc-950 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-zinc-400">
            {language.toUpperCase()}
          </span>
          <span className="text-zinc-500">
            UTF-8
          </span>
          <span className="text-zinc-500">
            {value.split('\n').length} lines
          </span>
          <span className="text-zinc-500">
            {value.length.toLocaleString()} chars
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          {isDirty && <span className="text-amber-400">Unsaved changes</span>}
          <span>Cmd+S to save</span>
        </div>
      </div>
    </div>
  )
}
