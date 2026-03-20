import { supabaseAdmin } from './supabase'
import type { Pipeline, PipelineRun, PipelineConfig, PipelineLog } from '@/types/cicd'

export async function createPipeline(
  projectId: string, 
  name: string, 
  config: PipelineConfig
) {
  const { data, error } = await supabaseAdmin
    .from('pipelines')
    .insert({
      project_id: projectId,
      name,
      config,
      status: 'idle',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function triggerPipeline(
  pipelineId: string, 
  triggerType: string,
  branch: string,
  commitSha?: string,
  commitMessage?: string
) {
  const { data: pipeline } = await supabaseAdmin
    .from('pipelines')
    .select('*')
    .eq('id', pipelineId)
    .single()

  if (!pipeline) throw new Error('Pipeline not found')

  // Create run
  const { data: run, error } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({
      pipeline_id: pipelineId,
      status: 'running',
      trigger: triggerType,
      branch,
      commit_sha: commitSha,
      commit_message: commitMessage,
      steps: pipeline.config.steps.map(step => ({
        step_id: step.id,
        status: 'idle',
        logs: [],
      })),
      logs: [],
    })
    .select()
    .single()

  if (error) throw error

  // Update pipeline status
  await supabaseAdmin
    .from('pipelines')
    .update({ 
      status: 'running',
      last_run_at: new Date().toISOString(),
    })
    .eq('id', pipelineId)

  // Execute pipeline (async)
  executePipelineRun(run.id, pipeline.config)

  return run
}

async function executePipelineRun(runId: string, config: PipelineConfig) {
  const startTime = Date.now()
  
  try {
    for (const step of config.steps) {
      // Update step to running
      await updateStepStatus(runId, step.id, 'running')
      
      const stepStartTime = Date.now()
      
      // Execute step
      const result = await executeStep(step)
      
      const stepDuration = Date.now() - stepStartTime
      
      if (result.success) {
        await updateStepStatus(runId, step.id, 'success', stepDuration, result.logs)
      } else {
        await updateStepStatus(runId, step.id, 'failed', stepDuration, result.logs, result.error)
        
        if (!step.continueOnError) {
          await failPipeline(runId, `Step "${step.name}" failed`)
          return
        }
      }
    }
    
    // Complete successfully
    await completePipeline(runId, Date.now() - startTime)
    
  } catch (error) {
    await failPipeline(runId, error instanceof Error ? error.message : 'Unknown error')
  }
}

async function executeStep(step: { type: string; command?: string; id: string }) {
  // This would integrate with actual build infrastructure
  // For now, simulating execution
  const logs: string[] = []
  
  logs.push(`[INFO] Starting step: ${step.name}`)
  
  try {
    switch (step.type) {
      case 'build':
        logs.push('[INFO] Running npm install...')
        logs.push('[INFO] Running npm run build...')
        break
      case 'test':
        logs.push('[INFO] Running tests...')
        break
      case 'lint':
        logs.push('[INFO] Running ESLint...')
        break
      case 'deploy':
        logs.push('[INFO] Deploying to Vercel...')
        break
      default:
        logs.push(`[INFO] Executing: ${step.command}`)
    }
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    logs.push(`[INFO] Step completed successfully`)
    
    return { success: true, logs }
  } catch (error) {
    return { 
      success: false, 
      logs,
      error: error instanceof Error ? error.message : 'Step failed'
    }
  }
}

async function updateStepStatus(
  runId: string, 
  stepId: string, 
  status: string,
  duration?: number,
  logs?: string[],
  error?: string
) {
  const { data: run } = await supabaseAdmin
    .from('pipeline_runs')
    .select('steps')
    .eq('id', runId)
    .single()

  if (!run) return

  const steps = run.steps.map((step: any) => {
    if (step.step_id === stepId) {
      return {
        ...step,
        status,
        started_at: status === 'running' ? new Date().toISOString() : step.started_at,
        completed_at: status !== 'running' ? new Date().toISOString() : undefined,
        duration_ms: duration,
        logs: logs || step.logs,
        error_message: error,
      }
    }
    return step
  })

  await supabaseAdmin
    .from('pipeline_runs')
    .update({ steps })
    .eq('id', runId)
}

async function completePipeline(runId: string, duration: number) {
  await supabaseAdmin
    .from('pipeline_runs')
    .update({
      status: 'success',
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    })
    .eq('id', runId)

  const { data: run } = await supabaseAdmin
    .from('pipeline_runs')
    .select('pipeline_id')
    .eq('id', runId)
    .single()

  if (run) {
    await supabaseAdmin
      .from('pipelines')
      .update({ status: 'success' })
      .eq('id', run.pipeline_id)
  }
}

async function failPipeline(runId: string, errorMessage: string) {
  await supabaseAdmin
    .from('pipeline_runs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('id', runId)

  const { data: run } = await supabaseAdmin
    .from('pipeline_runs')
    .select('pipeline_id')
    .eq('id', runId)
    .single()

  if (run) {
    await supabaseAdmin
      .from('pipelines')
      .update({ status: 'failed' })
      .eq('id', run.pipeline_id)
  }
}

export async function getPipelineRuns(pipelineId: string, limit: number = 20) {
  const { data, error } = await supabaseAdmin
    .from('pipeline_runs')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function cancelPipelineRun(runId: string) {
  await supabaseAdmin
    .from('pipeline_runs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
}
