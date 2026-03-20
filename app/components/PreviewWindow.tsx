'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Tablet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Maximize2,
  X,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { renderPreview } from '@/lib/preview-service'
import type { PreviewWindowProps } from '@/types/preview'

type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'fullscreen'

const VIEWPORT_CONFIGS: Record<ViewportSize, { width: string; height: string; label: string; icon: typeof Smartphone }> = {
  mobile: { width: '375px', height: '100%', label: 'Mobile', icon: Smartphone },
  tablet: { width: '768px', height: '100%', label: 'Tablet', icon: Tablet },
  desktop: { width: '100%', height: '100%', label: 'Desktop', icon: Monitor },
  fullscreen: { width: '100%', height: '100%', label: 'Fullscreen', icon: Maximize2 },
}

export function PreviewWindow({
  files,
  activeFileId,
  isVisible,
  onError,
  onLoad,
}: PreviewWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [framework, setFramework] = useState<string>('unknown')
  const [showWarnings, setShowWarnings] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_ERROR') {
        const errorMsg = `Line ${event.data.line}: ${event.data.message}`
        setError(errorMsg)
        onError(errorMsg)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onError])

  // Render preview when files change
  const render = useCallback(() => {
    if (!isVisible || files.length === 0) return

    setIsLoading(true)
    setError(null)
    setWarnings([])

    try {
      const result = renderPreview(files)
      
      setWarnings(result.warnings)
      setFramework(result.framework)
      
      if (!result.isSafe && result.warnings.length > 0) {
        console.warn('Preview warnings:', result.warnings)
      }

      // Set iframe srcdoc
      if (iframeRef.current) {
        iframeRef.current.srcdoc = result.html
      }

      setLastUpdate(new Date())
      onLoad()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to render preview'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      // Small delay to show loading state
      setTimeout(() => setIsLoading(false), 300)
    }
  }, [files, isVisible, onError, onLoad])

  // Initial render and refresh
  useEffect(() => {
    render()
  }, [render, refreshKey])

  // Auto-refresh when files change (with debounce)
  useEffect(() => {
    if (!isVisible) return
    
    const timer = setTimeout(() => {
      render()
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [files, activeFileId, isVisible, render])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleOpenInNewTab = () => {
    const result = renderPreview(files)
    const blob = new Blob([result.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const CurrentViewportIcon = VIEWPORT_CONFIGS[viewport].icon

  if (!isVisible) return null

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Live Preview</span>
          {framework !== 'unknown' && (
            <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded">
              {framework}
            </span>
          )}
          {lastUpdate && (
            <span className="text-xs text-zinc-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Viewport toggle */}
          {(Object.keys(VIEWPORT_CONFIGS) as ViewportSize[]).map((size) => {
            const Icon = VIEWPORT_CONFIGS[size].icon
            return (
              <button
                key={size}
                onClick={() => setViewport(size)}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewport === size
                    ? 'bg-zinc-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                )}
                title={VIEWPORT_CONFIGS[size].label}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}

          <div className="w-px h-4 bg-zinc-600 mx-2" />

          {/* Warnings toggle */}
          {warnings.length > 0 && (
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs',
                showWarnings
                  ? 'bg-amber-900/50 text-amber-400'
                  : 'text-amber-500 hover:bg-amber-900/30'
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {warnings.length}
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>

          {/* Open in new tab */}
          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Warnings panel */}
      {showWarnings && warnings.length > 0 && (
        <div className="bg-amber-900/20 border-b border-amber-800/50 px-3 py-2">
          <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Security Warnings</span>
            <button
              onClick={() => setShowWarnings(false)}
              className="ml-auto p-1 hover:bg-amber-900/30 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <ul className="text-xs text-amber-400/80 space-y-0.5 pl-6">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 relative bg-zinc-950 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-10">
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Rendering...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 z-20 p-6">
            <div className="max-w-md w-full">
              <div className="flex items-center gap-2 text-red-400 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Preview Error</span>
              </div>
              <div className="bg-red-950/30 border border-red-800 rounded-lg p-4">
                <code className="text-sm text-red-300 font-mono whitespace-pre-wrap">
                  {error}
                </code>
              </div>
              <button
                onClick={handleRefresh}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Iframe container with responsive sizing */}
        <div 
          className={cn(
            'h-full flex items-center justify-center p-4',
            viewport === 'desktop' || viewport === 'fullscreen' ? 'w-full' : ''
          )}
        >
          <div
            className={cn(
              'relative bg-white rounded-lg shadow-2xl overflow-hidden',
              viewport !== 'fullscreen' && 'border border-zinc-700'
            )}
            style={{
              width: VIEWPORT_CONFIGS[viewport].width,
              height: VIEWPORT_CONFIGS[viewport].height,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {viewport !== 'fullscreen' && viewport !== 'desktop' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1">
                <div className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded">
                  {VIEWPORT_CONFIGS[viewport].label} • {VIEWPORT_CONFIGS[viewport].width}
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
              title="Preview"
              onLoad={() => {
                setIsLoading(false)
                onLoad()
              }}
              onError={() => {
                setError('Failed to load preview')
                onError('Failed to load preview')
              }}
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 border-t border-zinc-700 text-xs">
        <div className="flex items-center gap-3 text-zinc-500">
          {error ? (
            <span className="text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Error
            </span>
          ) : (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Ready
            </span>
          )}
          <span>{files.length} files</span>
        </div>
        <div className="text-zinc-600">
          Sandbox active • CSP enforced
        </div>
      </div>
    </div>
  )
}