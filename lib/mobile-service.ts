import { supabaseAdmin } from './supabase'
import type { MobileExport, MobileBuild, MobilePlatform } from '@/types/mobile'
import { MOBILE_BUILD_PRICING } from '@/types/mobile'

export async function createMobileExport(
  projectId: string,
  platform: MobilePlatform,
  userId: string,
  config: { appName: string; bundleId: string; version: string }
): Promise<MobileExport> {
  // Calculate cost based on platform - NEW PRICING: $1.20 per build
  const costCredits = platform === 'both' ? 200 : 120  // $2.00 bundle or $1.20 single
  const costUSD = costCredits / 100

  // Check if user has enough credits
  const { data: balance } = await supabaseAdmin
    .from('credit_balances')
    .select('credits')
    .eq('user_id', userId)
    .single()

  if (!balance || balance.credits < costCredits) {
    throw new Error(`Insufficient credits. Mobile build requires ${formatCost(costCredits)}. Please purchase more credits.`)
  }

  // Deduct credits
  await supabaseAdmin.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: costCredits,
  })

  // Record usage
  await supabaseAdmin
    .from('credit_usage')
    .insert({
      user_id: userId,
      action: `mobile_export_${platform}`,
      credits_used: costCredits,
      project_id: projectId,
      details: { platform, config },
    })

  // Create export record
  const { data, error } = await supabaseAdmin
    .from('mobile_exports')
    .insert({
      project_id: projectId,
      user_id: userId,
      platform,
      framework: 'react-native', // Default
      status: 'queued',
      config,
      cost_credits: costCredits,
      cost_usd: costUSD,
    })
    .select()
    .single()

  if (error) throw error

  // Queue build job (async)
  await queueMobileBuild(data.id, platform, config)

  return {
    id: data.id,
    projectId: data.project_id,
    platform: data.platform,
    framework: data.framework,
    status: data.status,
    config: data.config,
    costCredits: data.cost_credits,
    costUSD: data.cost_usd,
    createdAt: data.created_at,
  }
}

export async function getMobileExportStatus(exportId: string): Promise<MobileExport> {
  const { data, error } = await supabaseAdmin
    .from('mobile_exports')
    .select('*')
    .eq('id', exportId)
    .single()

  if (error) throw error

  return {
    id: data.id,
    projectId: data.project_id,
    platform: data.platform,
    framework: data.framework,
    status: data.status,
    config: data.config,
    builds: data.builds,
    downloadUrl: data.download_url,
    costCredits: data.cost_credits,
    costUSD: data.cost_usd,
    createdAt: data.created_at,
    completedAt: data.completed_at,
    error: data.error,
  }
}

export async function getUserMobileExports(userId: string, limit: number = 50): Promise<MobileExport[]> {
  const { data, error } = await supabaseAdmin
    .from('mobile_exports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map((e: any) => ({
    id: e.id,
    projectId: e.project_id,
    platform: e.platform,
    framework: e.framework,
    status: e.status,
    config: e.config,
    builds: e.builds,
    downloadUrl: e.download_url,
    costCredits: e.cost_credits,
    costUSD: e.cost_usd,
    createdAt: e.created_at,
    completedAt: e.completed_at,
    error: e.error,
  }))
}

export async function cancelMobileExport(exportId: string, userId: string): Promise<boolean> {
  // Get export
  const { data: exportData } = await supabaseAdmin
    .from('mobile_exports')
    .select('*')
    .eq('id', exportId)
    .eq('user_id', userId)
    .single()

  if (!exportData) return false

  // Can only cancel queued or building
  if (!['queued', 'building'].includes(exportData.status)) {
    return false
  }

  // Update status
  await supabaseAdmin
    .from('mobile_exports')
    .update({ status: 'cancelled' })
    .eq('id', exportId)

  // Refund credits (50% since resources may have been used)
  const refundCredits = Math.floor(exportData.cost_credits * 0.5)
  
  await supabaseAdmin.rpc('add_credits', {
    p_user_id: userId,
    p_amount: refundCredits,
  })

  await supabaseAdmin
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: refundCredits,
      type: 'refund',
      description: `Refund for cancelled mobile build (50%)`,
    })

  return true
}

export function getMobileBuildCost(platform: MobilePlatform): number {
  // NEW PRICING: $1.20 per build, $2.00 for both
  switch (platform) {
    case 'ios': return 120      // $1.20
    case 'android': return 120  // $1.20
    case 'both': return 200     // $2.00 (bundle discount)
    default: return 120
  }
}

export function formatCost(credits: number): string {
  return `$${(credits / 100).toFixed(2)}`
}

// Queue mobile build for processing
async function queueMobileBuild(
  exportId: string,
  platform: MobilePlatform,
  config: any
): Promise<void> {
  // In production, this would queue to a worker (Bull/BullMQ, SQS, etc.)
  console.log(`Queuing mobile build ${exportId} for ${platform}`)
  
  // Simulate async processing
  setTimeout(async () => {
    await supabaseAdmin
      .from('mobile_exports')
      .update({ status: 'building' })
      .eq('id', exportId)
    
    // After "building" completes, update to completed
    setTimeout(async () => {
      await supabaseAdmin
        .from('mobile_exports')
        .update({
          status: 'completed',
          download_url: `https://builds.example.com/${exportId}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportId)
    }, 30000) // 30 second build time
  }, 1000)
}
