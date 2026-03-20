export type PluginStatus = 'active' | 'inactive' | 'error' | 'updating'
export type PluginCategory = 'ai' | 'ui' | 'integration' | 'tool' | 'theme'

export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: PluginCategory
  icon?: string
  readme?: string
  config: PluginConfig
  permissions: string[]
  hooks: PluginHook[]
  createdAt: string
  updatedAt: string
  downloads: number
  rating: number
  isOfficial: boolean
  price?: number // in cents, undefined = free
}

export interface PluginConfig {
  schema: Record<string, PluginConfigField>
  defaults: Record<string, unknown>
}

export interface PluginConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'json'
  label: string
  description?: string
  required: boolean
  options?: string[]
  default?: unknown
  secret?: boolean
}

export interface PluginHook {
  event: string
  handler: string
  priority: number
}

export interface InstalledPlugin {
  id: string
  pluginId: string
  projectId: string
  status: PluginStatus
  config: Record<string, unknown>
  installedAt: string
  updatedAt: string
  lastError?: string
}

export interface PluginMarketplace {
  featured: Plugin[]
  trending: Plugin[]
  categories: Record<PluginCategory, Plugin[]>
}
