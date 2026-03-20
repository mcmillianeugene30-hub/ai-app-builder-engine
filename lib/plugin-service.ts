import { supabaseAdmin } from './supabase'
import type { Plugin, InstalledPlugin, PluginMarketplace } from '@/types/plugin'

export async function getMarketplacePlugins(): Promise<PluginMarketplace> {
  const { data: plugins, error } = await supabaseAdmin
    .from('plugins')
    .select('*')
    .eq('status', 'published')
    .order('downloads', { ascending: false })

  if (error) throw error

  return {
    featured: plugins.filter((p: Plugin) => p.isOfficial).slice(0, 6),
    trending: plugins.slice(0, 10),
    categories: {
      ai: plugins.filter((p: Plugin) => p.category === 'ai'),
      ui: plugins.filter((p: Plugin) => p.category === 'ui'),
      integration: plugins.filter((p: Plugin) => p.category === 'integration'),
      tool: plugins.filter((p: Plugin) => p.category === 'tool'),
      theme: plugins.filter((p: Plugin) => p.category === 'theme'),
    },
  }
}

export async function installPlugin(
  pluginId: string, 
  projectId: string, 
  config: Record<string, unknown> = {}
) {
  const { data: plugin } = await supabaseAdmin
    .from('plugins')
    .select('*')
    .eq('id', pluginId)
    .single()

  if (!plugin) throw new Error('Plugin not found')

  // Check if already installed
  const { data: existing } = await supabaseAdmin
    .from('installed_plugins')
    .select('*')
    .eq('plugin_id', pluginId)
    .eq('project_id', projectId)
    .single()

  if (existing) {
    throw new Error('Plugin already installed')
  }

  const { data, error } = await supabaseAdmin
    .from('installed_plugins')
    .insert({
      plugin_id: pluginId,
      project_id: projectId,
      status: 'active',
      config: { ...plugin.config.defaults, ...config },
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProjectPlugins(projectId: string): Promise<InstalledPlugin[]> {
  const { data, error } = await supabaseAdmin
    .from('installed_plugins')
    .select(`
      *,
      plugin:plugin_id (*)
    `)
    .eq('project_id', projectId)

  if (error) throw error
  return data
}

export async function updatePluginConfig(
  installedPluginId: string, 
  config: Record<string, unknown>
) {
  await supabaseAdmin
    .from('installed_plugins')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('id', installedPluginId)
}

export async function uninstallPlugin(installedPluginId: string) {
  await supabaseAdmin
    .from('installed_plugins')
    .delete()
    .eq('id', installedPluginId)
}
