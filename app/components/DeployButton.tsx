'use client'

import { useState, useCallback } from 'react'
import { 
  Rocket, 
  Loader2, 
  Check, 
  AlertCircle,
  ExternalLink,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { deployToVercel, prepareFilesForDeploy } from '@/lib/deploy-service'
import type { DeployButtonProps, DeployState } from '@/types/deploy'

export function DeployButton({ 
  files, 
  projectName,
  onDeploy,
  disabled = false,
}: DeployButtonProps) {
  const [deployState, setDeployState] = useState<DeployState>({
    status: 'idle',
  })
  
  const deploy = useCallback(async () => {
    if (!files || files.length === 0) return
    
    setDeployState({ status: 'preparing' })
    
    try {
      setDeployState({ status: 'uploading' })
      
      const result = await deployToVercel(files, {
        name: projectName || 'ai-app',
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Deployment failed')
      }
      
      setDeployState({
        status: 'ready',
        url: result.url,
        deploymentId: result.deploymentId,
      })
      
      onDeploy?.(result.url!)
      
      // Poll for status
      if (result.deploymentId) {
        pollDeploymentStatus(result.deploymentId)
      }
    } catch (error) {
      setDeployState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Deployment failed',
      })
    }
  }, [files, projectName, onDeploy])
  
  const pollDeploymentStatus = useCallback(async (deploymentId: string) => {
    const { getDeploymentStatus } = await import('@/lib/deploy-service')
    
    const interval = setInterval(async () => {
      const status = await getDeploymentStatus(deploymentId)
      
      if (status.status === 'ready') {
        setDeployState(prev => ({
          ...prev,
          status: 'ready',
          url: status.url,
        }))
        clearInterval(interval)
      } else if (status.status === 'error') {
        setDeployState(prev => ({
          ...prev,
          status: 'error',
          error: status.error,
        }))
        clearInterval(interval)
      }
    }, 3000)
    
    // Timeout after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000)
  }, [])
  
  const getButtonContent = () => {
    switch (deployState.status) {
      case 'preparing':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Preparing...</span>
          </>
        )
      case 'uploading':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Deploying...</span>
          </>
        )
      case 'building':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Building...</span>
          </>
        )
      case 'ready':
        return (
          <>
            <Check className="w-4 h-4" />
            <span>Live!</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Retry</span>
          </>
        )
      default:
        return (
          <>
            <Rocket className="w-4 h-4" />
            <span>Deploy</span>
          </>
        )
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={deploy}
        disabled={disabled || deployState.status === 'preparing' || deployState.status === 'uploading' || deployState.status === 'building'}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all',
          deployState.status === 'ready'
            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            : deployState.status === 'error'
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-indigo-500 hover:bg-indigo-600 text-white',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {getButtonContent()}
      </button>
      
      {deployState.url && (
        <a
          href={deployState.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Visit
        </a>
      )}
    </div>
  )
}
