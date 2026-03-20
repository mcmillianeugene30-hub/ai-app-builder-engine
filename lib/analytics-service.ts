import { supabaseAdmin } from './supabase'
import type { AnalyticsDashboard, AnalyticsOverview, UsageBreakdown } from '@/types/analytics'

export async function getUserAnalytics(
  userId: string,
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Promise<AnalyticsDashboard> {
  const startDate = getPeriodStart(period)
  const endDate = new Date()

  // Get usage statistics
  const { data: usageStats } = await supabaseAdmin
    .from('credit_usage')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Get projects count
  const { count: totalProjects } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get deployments count
  const { count: totalDeployments } = await supabaseAdmin
    .from('deployments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  const overview: AnalyticsOverview = {
    totalProjects: totalProjects || 0,
    totalDeployments: totalDeployments || 0,
    totalCreditsUsed: usageStats?.reduce((sum: number, u: any) => sum + u.credits_used, 0) || 0,
    totalStorageMB: 0, // Would calculate from storage
    apiCalls: 0,
    activeCollaborations: 0,
    changes: {},
  }

  return {
    userId,
    period,
    overview,
    charts: [],
    tables: [],
    generatedAt: new Date().toISOString(),
  }
}

export async function getUsageBreakdown(userId: string, period: string): Promise<UsageBreakdown[]> {
  const { data } = await supabaseAdmin
    .from('credit_usage')
    .select('action, credits_used')
    .eq('user_id', userId)
    .gte('created_at', `${period}-01`)
    .lte('created_at', `${period}-31`)

  if (!data) return []

  const grouped = data.reduce((acc: Record<string, number>, item: any) => {
    acc[item.action] = (acc[item.action] || 0) + item.credits_used
    return acc
  }, {})

  const total = Object.values(grouped).reduce((sum: number, val: number) => sum + val, 0)

  return Object.entries(grouped).map(([category, credits]) => ({
    category,
    creditsUsed: credits as number,
    percentage: total > 0 ? Math.round(((credits as number) / total) * 100) : 0,
    cost: (credits as number) * 0.01, // $0.01 per credit
  }))
}

export async function getTeamAnalytics(teamId: string, period: string) {
  const { data: members } = await supabaseAdmin
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)

  const userIds = members?.map((m: any) => m.user_id) || []

  // Aggregate team usage
  const { data: usage } = await supabaseAdmin
    .from('credit_usage')
    .select('*')
    .in('user_id', userIds)
    .gte('created_at', `${period}-01`)
    .lte('created_at', `${period}-31`)

  return {
    totalCreditsUsed: usage?.reduce((sum: number, u: any) => sum + u.credits_used, 0) || 0,
    activeMembers: userIds.length,
    projectCount: 0,
    deploymentCount: 0,
  }
}

function getPeriodStart(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'day':
      return new Date(now.setDate(now.getDate() - 1))
    case 'week':
      return new Date(now.setDate(now.getDate() - 7))
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1))
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3))
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1))
    default:
      return new Date(now.setMonth(now.getMonth() - 1))
  }
}
