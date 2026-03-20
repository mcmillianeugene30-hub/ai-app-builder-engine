'use client'

import { useEffect, useState } from 'react'
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Copy,
  CheckCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeployStatusProps, DeploymentStatus } from '@/types/deploy'

export function DeployStatus({ 
  deploymentId, 
  initialUrl,
  onStatusChange,
  className,
}: DeployStatusProps) {
  const [status, setStatus] = useState<DeploymentStatus>({
    status: 'building',
    url: initialUrl,
  })
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    if (!deploymentId) return
    
    const pollStatus = async () => {
      try {
        const { getDeploymentStatus } = await import('@/lib/deploy-service')
        const newStatus = await getDeploymentStatus(deploymentId)
        setStatus(newStatus)
        onStatusChange?.(newStatus)
      } catch (error) {
        setStatus({
          status: 'error',
          error: 'Failed to fetch status',
        })
      }
    }
    
    const interval = setInterval(pollStatus, 5000)
    pollStatus() // Initial check
    
    return () => clearInterval(interval)
  }, [deploymentId, onStatusChange])
  
  const copyUrl = () => {
    if (status.url) {
      navigator.clipboard.writeText(status.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const getStatusIcon = () => {
    switch (status.status) {
      case 'building':
        return <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
      case 'ready':
        return <Check className="w-4 h-4 text-emerald-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
    }
  }
  
  const getStatusText = () => {
    switch (status.status) {
      case 'building':
        return 'Building...'
      case 'ready':
        return 'Live'
      case 'error':
        return status.error || 'Failed'
    }
  }
  
  return (
    <div className={cn('p-4 bg-zinc-900 rounded-lg', className)}>
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <span className="font-medium text-sm">{getStatusText()}</span>
      </div>
      
      {status.url && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-zinc-950 rounded text-xs">
            <span className="text-zinc-400 truncate flex-1">{status.url}</span>
            <button
              onClick={copyUrl}
              className="p-1 hover:bg-zinc-800 rounded transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <CheckCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-zinc-500" />
              )}
            </button>
            <a
              href={status.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-zinc-800 rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
          
          {status.status === 'ready' && (
            <a
              href={status.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View Live Site
            </a>
          )}
        </div>
      )}
    </div>
  )
}
