'use client'

import { useState, useCallback } from 'react'
import { 
  Download, 
  FileArchive, 
  ExternalLink, 
  Github,
  Container,
  Zap,
  Loader2,
  Check,
  AlertCircle,
  FileCode
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportAsZip, downloadBlob } from '@/lib/export-service'
import type { Project } from '@/types/project'
import type { ExportFormat, ExportResult, ZipExportResult } from '@/types/export'

interface ExportPanelProps {
  project: Project | null
  onExport?: (result: ExportResult) => void
  className?: string
}

const EXPORT_OPTIONS: { format: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  {
    format: 'zip',
    label: 'Download ZIP',
    icon: <FileArchive className="w-5 h-5" />,
    description: 'Download all project files as a ZIP archive'
  },
  {
    format: 'vercel',
    label: 'Deploy to Vercel',
    icon: <Zap className="w-5 h-5" />,
    description: 'One-click deployment to Vercel'
  },
  {
    format: 'github',
    label: 'Push to GitHub',
    icon: <Github className="w-5 h-5" />,
    description: 'Create a new GitHub repository'
  }
]

export function ExportPanel({ project, onExport, className }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(format)
    setError(null)
    setResult(null)

    try {
      let exportResult: ExportResult | ZipExportResult

      switch (format) {
        case 'zip':
          exportResult = await exportAsZip(project)
          if (exportResult.blob) {
            downloadBlob(exportResult.blob, `${project.name}.zip`)
          }
          break

        case 'vercel':
          // Vercel deployment would require OAuth or token
          exportResult = {
            logs: [] as string[],
            success: true,
            message: 'Redirecting to Vercel...',
            url: `https://vercel.com/new?repository-url=${encodeURIComponent(`https://github.com/user/${project.name}`)}`
          }
          window.open(exportResult.url!, '_blank')
          break

        case 'github':
          exportResult = {
            logs: [] as string[],
            success: true,
            message: 'GitHub integration coming soon',
            url: `https://github.com/new?repository_name=${encodeURIComponent(project.name)}`
          }
          window.open(exportResult.url!, '_blank')
          break

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      setResult(exportResult)
      onExport?.(exportResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(null)
    }
  }, [project, onExport])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Export Project</h3>
        {result?.success && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Check className="w-3 h-3" />
            Success
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Success */}
      {result?.success && result.url && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <a 
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300"
          >
            <ExternalLink className="w-3 h-3" />
            {result.message}
          </a>
        </div>
      )}

      {/* Export Options */}
      <div className="grid gap-2">
        {EXPORT_OPTIONS.map(({ format, label, icon, description }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting !== null}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
              isExporting === format
                ? "bg-blue-500/20 border-blue-500/40"
                : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50",
              isExporting !== null && isExporting !== format && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              isExporting === format ? "bg-blue-500/20" : "bg-gray-700/50"
            )}>
              {isExporting === format ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              ) : (
                <span className="text-gray-400">{icon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* File List Preview */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-xs font-medium text-gray-400 mb-2">
          Files to Export ({project.files.length})
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {project.files.slice(0, 10).map(file => (
            <div key={file.id} className="flex items-center gap-2 text-xs text-gray-500">
              <FileCode className="w-3 h-3" />
              <span className="truncate">{file.path}</span>
            </div>
          ))}
          {project.files.length > 10 && (
            <p className="text-xs text-gray-600">
              +{project.files.length - 10} more files...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}