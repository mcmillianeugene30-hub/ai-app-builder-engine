'use client'

import { useState, useCallback } from 'react'
import { 
  Download, 
  FileArchive, 
  ExternalLink, 
  Github,
  CodeSandbox,
  Zap,
  Loader2,
  Check,
  AlertCircle,
  FileCode
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportAsZip, downloadBlob } from '@/lib/export-service'
import type { Project } from '@/types/project'
import type { ExportFormat, ExportResult } from '@/types/export'

const exportOptions: { 
  format: ExportFormat; 
  label: string; 
  icon: typeof Download;
  description: string;
  comingSoon?: boolean;
}[] = [
  { 
    format: 'zip', 
    label: 'Download ZIP', 
    icon: FileArchive, 
    description: 'Download all files as a ZIP archive' 
  },
  { 
    format: 'vercel', 
    label: 'Deploy to Vercel', 
    icon: Zap, 
    description: 'One-click deployment to Vercel',
    comingSoon: true,
  },
  { 
    format: 'github', 
    label: 'Push to GitHub', 
    icon: Github, 
    description: 'Create or update a GitHub repository' 
  },
  { 
    format: 'codesandbox', 
    label: 'Open in CodeSandbox', 
    icon: CodeSandbox, 
    description: 'Edit in CodeSandbox IDE',
    comingSoon: true,
  },
  { 
    format: 'stackblitz', 
    label: 'Open in StackBlitz', 
    icon: ExternalLink, 
    description: 'Edit in StackBlitz IDE',
    comingSoon: true,
  },
]

export function ExportPanel({ project, isVisible }: { project: Project | null; isVisible: boolean }) {
  const [isExporting, setIsExporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)
  
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!project) return
    
    setSelectedFormat(format)
    setIsExporting(true)
    setResult(null)
    
    try {
      switch (format) {
        case 'zip':
          const zipResult = await exportAsZip(project)
          if (zipResult.success && zipResult.blob) {
            downloadBlob(zipResult.blob, zipResult.filename)
            setResult({ 
              success: true, 
              message: `Downloaded ${zipResult.filename}` 
            })
          } else {
            setResult({ 
              success: false, 
              message: zipResult.error || 'Export failed' 
            })
          }
          break
          
        case 'github':
          // Open Git panel instead
          setResult({ 
            success: true, 
            message: 'Use the Git panel to push to GitHub' 
          })
          break
          
        case 'vercel':
        case 'codesandbox':
        case 'stackblitz':
          setResult({ 
            success: false, 
            message: 'Coming soon!' 
          })
          break
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Export failed' 
      })
    } finally {
      setIsExporting(false)
    }
  }, [project])
  
  const getFileCounts = () => {
    if (!project) return { total: 0, frontend: 0, backend: 0, database: 0 }
    return {
      total: project.files.length,
      frontend: project.files.filter(f => f.type === 'frontend').length,
      backend: project.files.filter(f => f.type === 'backend').length,
      database: project.files.filter(f => f.type === 'database').length,
    }
  }
  
  const counts = getFileCounts()
  
  if (!isVisible) return null
  
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-zinc-100" />
          <span className="font-medium text-zinc-100">Export & Deploy</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Project Summary */}
        {project && (
          <div className="p-4 bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-200">{project.name}</h3>
                <p className="text-xs text-zinc-500">{project.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-zinc-900 rounded">
                <div className="text-lg font-semibold text-zinc-200">{counts.total}</div>
                <div className="text-xs text-zinc-500">Files</div>
              </div>
              <div className="text-center p-2 bg-zinc-900 rounded">
                <div className="text-lg font-semibold text-blue-400">{counts.frontend}</div>
                <div className="text-xs text-zinc-500">Frontend</div>
              </div>
              <div className="text-center p-2 bg-zinc-900 rounded">
                <div className="text-lg font-semibold text-green-400">{counts.backend}</div>
                <div className="text-xs text-zinc-500">Backend</div>
              </div>
              <div className="text-center p-2 bg-zinc-900 rounded">
                <div className="text-lg font-semibold text-purple-400">{counts.database}</div>
                <div className="text-xs text-zinc-500">Database</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Export Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Export Options</h3>
          
          <div className="space-y-2">
            {exportOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedFormat === option.format
              
              return (
                <button
                  key={option.format}
                  onClick={() => !option.comingSoon && handleExport(option.format)}
                  disabled={!project || isExporting || option.comingSoon}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all',
                    option.comingSoon
                      ? 'opacity-50 cursor-not-allowed bg-zinc-800'
                      : isSelected && isExporting
                        ? 'bg-blue-900/30 border border-blue-700'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    option.format === 'zip' && 'bg-amber-600',
                    option.format === 'vercel' && 'bg-black border border-zinc-700',
                    option.format === 'github' && 'bg-zinc-700',
                    option.format === 'codesandbox' && 'bg-blue-600',
                    option.format === 'stackblitz' && 'bg-purple-600',
                  )}>
                    {isSelected && isExporting ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200">{option.label}</span>
                      {option.comingSoon && (
                        <span className="text-xs px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Result */}
        {result && (
          <div className={cn(
            'flex items-start gap-2 p-4 rounded-lg',
            result.success 
              ? 'bg-green-900/20 border border-green-700' 
              : 'bg-red-900/30 border border-red-700'
          )}>
            {result.success ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                'text-sm',
                result.success ? 'text-green-200' : 'text-red-200'
              )}>
                {result.message}
              </p>
              {result.url && (
                <a 
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  {result.url}
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* No Project */}
        {!project && (
          <div className="text-center py-8">
            <FileCode className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No project loaded</p>
            <p className="text-sm text-zinc-600">Generate or open a project to export</p>
          </div>
        )}
      </div>
    </div>
  )
}