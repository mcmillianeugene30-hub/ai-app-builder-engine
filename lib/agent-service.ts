import { supabaseAdmin } from './supabase'
import type { AIAgent, AgentRun, AgentCapability } from '@/types/agent'

export async function createAgent(
  projectId: string,
  name: string,
  capabilities: AgentCapability[],
  config: { autoRun: boolean; notifyOnComplete: boolean; maxIterations: number }
) {
  const { data, error } = await supabaseAdmin
    .from('ai_agents')
    .insert({
      name,
      project_id: projectId,
      capabilities,
      status: 'idle',
      config,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function runAgent(agentId: string, userId: string) {
  const { data: agent } = await supabaseAdmin
    .from('ai_agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (!agent) throw new Error('Agent not found')

  // Create run
  const { data: run, error } = await supabaseAdmin
    .from('agent_runs')
    .insert({
      agent_id: agentId,
      status: 'running',
      started_at: new Date().toISOString(),
      tasks: [],
      changes: [],
      logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'Agent started' }],
    })
    .select()
    .single()

  if (error) throw error

  // Update agent status
  await supabaseAdmin
    .from('ai_agents')
    .update({ status: 'running', last_run_at: new Date().toISOString() })
    .eq('id', agentId)

  // Execute agent (async)
  executeAgentRun(agent, run.id, userId)

  return run
}

async function executeAgentRun(agent: AIAgent, runId: string, userId: string) {
  // This would integrate with actual AI for code review/refactoring
  // For now, simulating the agent run
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Complete the run
  await supabaseAdmin
    .from('agent_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      summary: 'Agent analysis completed',
    })
    .eq('id', runId)

  await supabaseAdmin
    .from('ai_agents')
    .update({ status: 'idle' })
    .eq('id', agent.id)
}

export async function getAgentRuns(agentId: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_runs')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProjectAgents(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('ai_agents')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data
}
