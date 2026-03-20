import { generateWithFallback, generateBatch } from './multi-provider-ai'
import type { Project, ProjectFile } from '@/types/project'
import type {
  AgentWorkflow,
  AgentTask,
  AgentPhase,
  Agent,
  AgentWorkflowResult,
  AgentMessage
} from '@/types/agent-workflow'
import { AGENTS, AGENT_PHASES } from '@/types/agent-workflow'
import { supabaseAdmin } from './supabase'

// Create a new workflow
export async function createWorkflow(
  userId: string,
  projectId: string,
  initialPrompt: string
): Promise<AgentWorkflow> {
  const workflowId = crypto.randomUUID()
  
  // Create tasks for each agent
  const tasks: AgentTask[] = []
  
  // Phase 1: Planning
  const architectTask = createTask(workflowId, 'architect', 'planning', 
    `Design system architecture for: ${initialPrompt}`)
  const pmTask = createTask(workflowId, 'product-manager', 'planning',
    `Define product requirements for: ${initialPrompt}`, [architectTask.id])
  
  tasks.push(architectTask, pmTask)
  
  // Phase 2: Development (depends on planning)
  const frontendTask = createTask(workflowId, 'frontend-dev', 'development',
    'Implement frontend based on architecture', [architectTask.id, pmTask.id])
  const backendTask = createTask(workflowId, 'backend-dev', 'development',
    'Implement backend API based on architecture', [architectTask.id])
  const dbTask = createTask(workflowId, 'database-dev', 'development',
    'Design and implement database', [architectTask.id])
  
  tasks.push(frontendTask, backendTask, dbTask)
  
  // Phase 3: Production (depends on development)
  const securityTask = createTask(workflowId, 'security-engineer', 'production',
    'Audit and secure the application', [frontendTask.id, backendTask.id])
  const perfTask = createTask(workflowId, 'performance-engineer', 'production',
    'Optimize performance', [frontendTask.id])
  const qaTask = createTask(workflowId, 'qa-engineer', 'production',
    'Test the application', [frontendTask.id, backendTask.id, dbTask.id])
  const devopsTask = createTask(workflowId, 'devops-engineer', 'production',
    'Set up CI/CD and infrastructure', [backendTask.id])
  
  tasks.push(securityTask, perfTask, qaTask, devopsTask)
  
  // Phase 4: Deployment (depends on production)
  const deployTask = createTask(workflowId, 'deployment-engineer', 'deployment',
    'Deploy to production', [securityTask.id, qaTask.id, devopsTask.id])
  
  tasks.push(deployTask)
  
  const workflow: AgentWorkflow = {
    id: workflowId,
    projectId,
    userId,
    initialPrompt,
    phases: ['planning', 'development', 'production', 'deployment'],
    tasks,
    currentPhase: 'planning',
    overallProgress: 0,
    status: 'idle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  // Save to database
  await supabaseAdmin.from('agent_workflows').insert({
    id: workflow.id,
    project_id: workflow.projectId,
    user_id: workflow.userId,
    initial_prompt: workflow.initialPrompt,
    current_phase: workflow.currentPhase,
    overall_progress: workflow.overallProgress,
    status: workflow.status,
    created_at: workflow.createdAt,
    updated_at: workflow.updatedAt,
  })
  
  // Save tasks
  await supabaseAdmin.from('agent_tasks').insert(
    tasks.map(t => ({
      id: t.id,
      workflow_id: workflow.id,
      agent_id: t.agentId,
      phase: t.phase,
      input: t.input,
      output: t.output,
      status: t.status,
      dependencies: t.dependencies,
      tokens_used: t.tokensUsed,
      duration: t.duration,
      error: t.error,
      created_at: t.createdAt,
      started_at: t.startedAt,
      completed_at: t.completedAt,
    }))
  )
  
  return workflow
}

function createTask(
  workflowId: string,
  agentId: string,
  phase: AgentPhase,
  input: string,
  dependencies: string[] = []
): AgentTask {
  return {
    id: crypto.randomUUID(),
    agentId,
    phase,
    input,
    status: 'pending',
    dependencies,
    tokensUsed: 0,
    duration: 0,
    createdAt: new Date().toISOString(),
  }
}

// Execute workflow
export async function executeWorkflow(
  workflowId: string,
  onProgress?: (workflow: AgentWorkflow) => void
): Promise<AgentWorkflowResult> {
  // Load workflow
  const workflow = await loadWorkflow(workflowId)
  if (!workflow) throw new Error('Workflow not found')
  
  // Update status
  await updateWorkflowStatus(workflowId, 'running')
  
  const result: AgentWorkflowResult = {
    frontend: [],
    backend: [],
    database: [],
    documentation: [],
    deploymentConfig: [],
    summary: '',
    totalTokens: 0,
    totalDuration: 0,
  }
  
  try {
    // Execute phases in order
    for (const phase of workflow.phases) {
      workflow.currentPhase = phase
      await updateWorkflowPhase(workflowId, phase)
      
      // Get tasks for this phase
      const phaseTasks = workflow.tasks.filter(t => t.phase === phase)
      
      // Execute tasks (respecting dependencies)
      for (const task of phaseTasks) {
        // Wait for dependencies
        await waitForDependencies(task, workflow)
        
        // Execute task
        await executeTask(task, workflow, result, onProgress)
      }
      
      // Update progress
      const completedTasks = workflow.tasks.filter(t => t.status === 'completed').length
      workflow.overallProgress = Math.round((completedTasks / workflow.tasks.length) * 100)
      await updateWorkflowProgress(workflowId, workflow.overallProgress)
      
      if (onProgress) onProgress(workflow)
    }
    
    // Mark complete
    workflow.status = 'completed'
    workflow.result = result
    await updateWorkflowStatus(workflowId, 'completed')
    
    return result
    
  } catch (error) {
    workflow.status = 'failed'
    await updateWorkflowStatus(workflowId, 'failed')
    throw error
  }
}

async function waitForDependencies(task: AgentTask, workflow: AgentWorkflow): Promise<void> {
  const maxWait = 300000 // 5 minutes
  const start = Date.now()
  
  while (Date.now() - start < maxWait) {
    const deps = workflow.tasks.filter(t => task.dependencies.includes(t.id))
    const allComplete = deps.every(t => t.status === 'completed')
    
    if (allComplete) return
    
    const anyFailed = deps.some(t => t.status === 'failed')
    if (anyFailed) {
      throw new Error(`Dependencies failed for task ${task.id}`)
    }
    
    await new Promise(r => setTimeout(r, 1000))
  }
  
  throw new Error(`Timeout waiting for dependencies for task ${task.id}`)
}

async function executeTask(
  task: AgentTask,
  workflow: AgentWorkflow,
  result: AgentWorkflowResult,
  onProgress?: (workflow: AgentWorkflow) => void
): Promise<void> {
  const agent = AGENTS.find(a => a.id === task.agentId)
  if (!agent) throw new Error(`Agent not found: ${task.agentId}`)
  
  // Update status
  task.status = 'running'
  task.startedAt = new Date().toISOString()
  await updateTaskStatus(task.id, 'running', task.startedAt)
  
  const startTime = Date.now()
  
  try {
    // Prepare context from previous tasks
    const context = buildContext(task, workflow, result)
    
    // Generate with AI
    const aiResult = await generateWithFallback({
      prompt: `${task.input}\n\nContext:\n${context}`,
      systemPrompt: agent.systemPrompt,
      maxRetries: 3,
      timeoutMs: 60000,
    })
    
    task.output = aiResult.content
    task.tokensUsed = aiResult.tokensUsed
    task.duration = Date.now() - startTime
    
    // Parse and store results
    parseTaskOutput(task, agent.phase, result)
    
    // Mark complete
    task.status = 'completed'
    task.completedAt = new Date().toISOString()
    await updateTaskStatus(task.id, 'completed', undefined, task.completedAt)
    
    // Track totals
    result.totalTokens += task.tokensUsed
    result.totalDuration += task.duration
    
  } catch (error) {
    task.status = 'failed'
    task.error = error instanceof Error ? error.message : 'Unknown error'
    await updateTaskStatus(task.id, 'failed', undefined, undefined, task.error)
    
    // Retry with different provider if possible
    if (task.status === 'failed') {
      await retryTaskWithFallback(task, workflow, result)
    }
  }
}

function buildContext(task: AgentTask, workflow: AgentWorkflow, result: AgentWorkflowResult): string {
  const parts: string[] = []
  
  // Add outputs from completed tasks in this phase or previous phases
  const relevantTasks = workflow.tasks.filter(t => {
    if (t.id === task.id) return false
    if (t.status !== 'completed') return false
    if (t.phase === task.phase) return true
    return AGENT_PHASES[t.phase].order < AGENT_PHASES[task.phase].order
  })
  
  for (const t of relevantTasks) {
    const agent = AGENTS.find(a => a.id === t.agentId)
    parts.push(`## ${agent?.name || t.agentId}\n${t.output?.substring(0, 2000) || ''}`)
  }
  
  // Add current project state
  if (result.frontend.length > 0) {
    parts.push(`\n## Frontend Files\n${result.frontend.map(f => f.path).join('\n')}`)
  }
  if (result.backend.length > 0) {
    parts.push(`\n## Backend Files\n${result.backend.map(f => f.path).join('\n')}`)
  }
  
  return parts.join('\n\n')
}

function parseTaskOutput(task: AgentTask, phase: AgentPhase, result: AgentWorkflowResult): void {
  const output = task.output || ''
  
  // Try to extract code blocks
  const codeBlocks = extractCodeBlocks(output)
  
  for (const block of codeBlocks) {
    const file: ProjectFile = {
      id: crypto.randomUUID(),
      name: block.filename || 'generated.ts',
      path: block.filename || 'generated.ts',
      content: block.code,
      type: detectFileType(block.filename || '', block.code),
      size: block.code.length,
      language: detectLanguage(block.filename || ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Categorize by phase
    switch (phase) {
      case 'planning':
        result.documentation.push(file)
        break
      case 'development':
        if (file.path.includes('frontend') || file.path.match(/\.(tsx|jsx|css)$/)) {
          result.frontend.push(file)
        } else if (file.path.includes('backend') || file.path.match(/\.(ts|js)$/)) {
          result.backend.push(file)
        } else if (file.path.match(/\.(sql|prisma)$/)) {
          result.database.push(file)
        }
        break
      case 'production':
        if (file.path.includes('test')) {
          result.frontend.push(file) // Test files
        } else if (file.path.includes('docker') || file.path.includes('.yml')) {
          result.deploymentConfig.push(file)
        }
        break
      case 'deployment':
        result.deploymentConfig.push(file)
        break
    }
  }
  
  // Extract summary
  if (output.includes('SUMMARY:')) {
    const summaryMatch = output.match(/SUMMARY:([\s\S]*?)(?=\n\n|$)/)
    if (summaryMatch) {
      result.summary += summaryMatch[1].trim() + '\n'
    }
  }
}

function extractCodeBlocks(text: string): Array<{ filename: string; code: string; language: string }> {
  const blocks: Array<{ filename: string; code: string; language: string }> = []
  
  // Match markdown code blocks with optional filename
  const regex = /```(\w+)?[\s]*(?:filename[:=]?\s*([^\n]+))?\n([\s\S]*?)```/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'typescript',
      filename: match[2]?.trim() || '',
      code: match[3].trim(),
    })
  }
  
  // Also try to find explicit file blocks
  const fileRegex = /(?:^|\n)(?:\/\/|\/\*|#)\s*(?:File|filename):\s*([^\n]+)\n([\s\S]*?)(?=(?:\/\/|\/\*|#)\s*(?:File|filename):|$)/g
  while ((match = fileRegex.exec(text)) !== null) {
    blocks.push({
      filename: match[1].trim(),
      code: match[2].trim(),
      language: detectLanguage(match[1].trim()),
    })
  }
  
  return blocks
}

function detectFileType(filename: string, content: string): 'frontend' | 'backend' | 'database' | 'config' {
  if (filename.match(/\.(tsx|jsx|css|scss|vue|svelte)$/)) return 'frontend'
  if (filename.match(/\.(sql|prisma|db|migration)$/)) return 'database'
  if (filename.match(/\.(json|yml|yaml|toml|config|env)$/)) return 'config'
  return 'backend'
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python',
    sql: 'sql',
    prisma: 'prisma',
    json: 'json',
    yml: 'yaml', yaml: 'yaml',
    css: 'css', scss: 'scss',
    html: 'html',
    md: 'markdown',
  }
  return map[ext] || 'plaintext'
}

async function retryTaskWithFallback(
  task: AgentTask,
  workflow: AgentWorkflow,
  result: AgentWorkflowResult
): Promise<void> {
  console.log(`Retrying task ${task.id} with fallback provider`)
  
  try {
    // Try with a different provider
    const aiResult = await generateWithFallback({
      prompt: task.input,
      systemPrompt: AGENTS.find(a => a.id === task.agentId)?.systemPrompt,
      provider: 'openai', // Fallback to OpenAI (paid but reliable)
      maxRetries: 2,
      timeoutMs: 60000,
    })
    
    task.output = aiResult.content
    task.tokensUsed = aiResult.tokensUsed
    task.status = 'completed'
    task.error = undefined
    task.completedAt = new Date().toISOString()
    
    parseTaskOutput(task, task.phase, result)
    
    await updateTaskStatus(task.id, 'completed', undefined, task.completedAt)
    
  } catch (error) {
    console.error(`Retry failed for task ${task.id}:`, error)
    throw error
  }
}

// Database helpers
async function loadWorkflow(workflowId: string): Promise<AgentWorkflow | null> {
  const { data: workflowData } = await supabaseAdmin
    .from('agent_workflows')
    .select('*')
    .eq('id', workflowId)
    .single()
  
  if (!workflowData) return null
  
  const { data: tasksData } = await supabaseAdmin
    .from('agent_tasks')
    .select('*')
    .eq('workflow_id', workflowId)
  
  return {
    id: workflowData.id,
    projectId: workflowData.project_id,
    userId: workflowData.user_id,
    initialPrompt: workflowData.initial_prompt,
    phases: workflowData.phases,
    tasks: tasksData?.map(t => ({
      id: t.id,
      agentId: t.agent_id,
      phase: t.phase,
      input: t.input,
      output: t.output,
      status: t.status,
      dependencies: t.dependencies,
      tokensUsed: t.tokens_used,
      duration: t.duration,
      error: t.error,
      createdAt: t.created_at,
      startedAt: t.started_at,
      completedAt: t.completed_at,
    })) || [],
    currentPhase: workflowData.current_phase,
    overallProgress: workflowData.overall_progress,
    status: workflowData.status,
    createdAt: workflowData.created_at,
    updatedAt: workflowData.updated_at,
  }
}

async function updateWorkflowStatus(workflowId: string, status: AgentWorkflow['status']) {
  await supabaseAdmin
    .from('agent_workflows')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', workflowId)
}

async function updateWorkflowPhase(workflowId: string, phase: AgentPhase) {
  await supabaseAdmin
    .from('agent_workflows')
    .update({ current_phase: phase, updated_at: new Date().toISOString() })
    .eq('id', workflowId)
}

async function updateWorkflowProgress(workflowId: string, progress: number) {
  await supabaseAdmin
    .from('agent_workflows')
    .update({ overall_progress: progress, updated_at: new Date().toISOString() })
    .eq('id', workflowId)
}

async function updateTaskStatus(
  taskId: string,
  status: AgentTask['status'],
  startedAt?: string,
  completedAt?: string,
  error?: string
) {
  const updates: any = { status }
  if (startedAt) updates.started_at = startedAt
  if (completedAt) updates.completed_at = completedAt
  if (error) updates.error = error
  
  await supabaseAdmin
    .from('agent_tasks')
    .update(updates)
    .eq('id', taskId)
}

// Export helpers
export function getAgents(): Agent[] {
  return AGENTS
}

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id)
}

export function getAgentsByPhase(phase: AgentPhase): Agent[] {
  return AGENTS.filter(a => a.phase === phase)
}

export async function getUserWorkflows(userId: string): Promise<AgentWorkflow[]> {
  const { data } = await supabaseAdmin
    .from('agent_workflows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return data?.map(w => ({
    id: w.id,
    projectId: w.project_id,
    userId: w.user_id,
    initialPrompt: w.initial_prompt,
    phases: w.phases,
    tasks: [],
    currentPhase: w.current_phase,
    overallProgress: w.overall_progress,
    status: w.status,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  })) || []
}

export async function cancelWorkflow(workflowId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('agent_workflows')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', workflowId)
    .select()
    .single()
  
  return !!data
}
