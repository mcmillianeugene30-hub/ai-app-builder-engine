'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Shield,
  Rocket,
  Compass,
  Target,
  Layout,
  Server,
  Database,
  GitBranch
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentWorkflow, AgentTask, AgentPhase, Agent } from '@/types/agent-workflow'
import { AGENTS, AGENT_PHASES } from '@/types/agent-workflow'

interface AgentWorkflowProps {
  workflow: AgentWorkflow | null
  onStart: () => void
  onPause: () => void
  onRetry: () => void
  onAgentClick?: (agent: Agent) => void
}

const PHASE_ICONS: Record<AgentPhase, React.ReactNode> = {
  planning: <Compass className="w-5 h-5" />,
  development: <Layout className="w-5 h-5" />,
  production: <Shield className="w-5 h-5" />,
  deployment: <Rocket className="w-5 h-5" />
}

const STATUS_COLORS = {
  pending: 'text-gray-400 bg-gray-100',
  running: 'text-blue-500 bg-blue-50 animate-pulse',
  completed: 'text-green-500 bg-green-50',
  failed: 'text-red-500 bg-red-50'
}

const AGENT_ICON_COMPONENTS: Record<string, React.ComponentType<{className?: string}>> = {
  Compass: Compass,
  Target: Target,
  Layout: Layout,
  Server: Server,
  Database: Database,
  Shield: Shield,
  Zap: Zap,
  CheckCircle: CheckCircle,
  GitBranch: GitBranch,
  Rocket: Rocket,
}

export function AgentWorkflowPanel({ 
  workflow, 
  onStart, 
  onPause, 
  onRetry,
  onAgentClick 
}: AgentWorkflowProps) {
  const [expandedPhases, setExpandedPhases] = useState<AgentPhase[]>(['planning'])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  
  const togglePhase = (phase: AgentPhase) => {
    setExpandedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    )
  }
  
  const getPhaseStatus = (phase: AgentPhase): AgentTask['status'] => {
    if (!workflow) return 'pending'
    const phaseTasks = workflow.tasks.filter(t => t.phase === phase)
    if (phaseTasks.every(t => t.status === 'completed')) return 'completed'
    if (phaseTasks.some(t => t.status === 'failed')) return 'failed'
    if (phaseTasks.some(t => t.status === 'running')) return 'running'
    return 'pending'
  }
  
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Multi-Agent Workflow
          </h3>
          <p className="text-sm text-gray-500">
            {workflow 
              ? `${workflow.tasks.filter(t => t.status === 'completed').length}/${workflow.tasks.length} tasks complete`
              : 'Ready to start'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!workflow || workflow.status === 'idle' ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          ) : workflow.status === 'running' ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          ) : workflow.status === 'failed' ? (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          ) : null}
        </div>
      </div>
      
      {/* Progress */}
      {workflow && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-500">{workflow.overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${workflow.overallProgress}%` }}
            />
          </div>
          
          {/* Phase indicators */}
          <div className="flex items-center justify-between mt-3">
            {(['planning', 'development', 'production', 'deployment'] as AgentPhase[]).map((phase, i) => (
              <div key={phase} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  getPhaseStatus(phase) === 'completed' ? 'bg-green-500 text-white' :
                  getPhaseStatus(phase) === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                  getPhaseStatus(phase) === 'failed' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-500'
                )}>
                  {i + 1}
                </div>
                {i < 3 && <ArrowRight className="w-4 h-4 text-gray-400" />}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Phases */}
      <div className="flex-1 overflow-y-auto">
        {(['planning', 'development', 'production', 'deployment'] as AgentPhase[]).map(phase => {
          const phaseInfo = AGENT_PHASES[phase]
          const phaseTasks = workflow?.tasks.filter(t => t.phase === phase) || []
          const status = getPhaseStatus(phase)
          const isExpanded = expandedPhases.includes(phase)
          const isCurrentPhase = workflow?.currentPhase === phase
          
          return (
            <div key={phase} className={cn(
              'border-b border-gray-200',
              isCurrentPhase && 'bg-purple-50'
            )}>
              {/* Phase header */}
              <button
                onClick={() => togglePhase(phase)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    status === 'completed' ? 'bg-green-100 text-green-600' :
                    status === 'running' ? 'bg-blue-100 text-blue-600' :
                    status === 'failed' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    {PHASE_ICONS[phase]}
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium">{phaseInfo.name}</h4>
                    <p className="text-xs text-gray-500">{phaseInfo.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    status === 'completed' ? 'bg-green-100 text-green-700' :
                    status === 'running' ? 'bg-blue-100 text-blue-700' :
                    status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {phaseTasks.filter(t => t.status === 'completed').length}/{phaseTasks.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* Tasks */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {phaseTasks.map(task => {
                    const agent = AGENTS.find(a => a.id === task.agentId)
                    const IconComponent = agent ? AGENT_ICON_COMPONENTS[agent.icon] || Compass : Compass
                    
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          selectedTask === task.id 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: agent?.color + '20', color: agent?.color }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{agent?.name}</span>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              STATUS_COLORS[task.status]
                            )}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{task.input}</p>
                        </div>
                        
                        {task.status === 'running' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {task.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {task.status === 'failed' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Selected task details */}
      {selectedTask && workflow && (
        <TaskDetailsPanel 
          task={workflow.tasks.find(t => t.id === selectedTask)!}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}

function TaskDetailsPanel({ task, onClose }: { task: AgentTask; onClose: () => void }) {
  const agent = AGENTS.find(a => a.id === task.agentId)
  
  return (
    <div className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-lg max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-medium">{agent?.name}</span>
          <span className="text-xs text-gray-500">{task.phase}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          ✕
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Input</label>
          <p className="text-sm mt-1">{task.input}</p>
        </div>
        
        {task.output && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Output</label>
            <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-x-auto">
              {task.output.substring(0, 1000)}...
            </pre>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {task.tokensUsed > 0 && (
            <span>Tokens: {task.tokensUsed.toLocaleString()}</span>
          )}
          {task.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(task.duration / 1000).toFixed(1)}s
            </span>
          )}
          {task.error && (
            <span className="text-red-500">Error: {task.error}</span>
          )}
        </div>
      </div>
    </div>
  )
}
