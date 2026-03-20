export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Team {
  id: string
  name: string
  slug: string
  avatarUrl?: string
  subscriptionTier: SubscriptionTier
  subscriptionId: string
  ownerId: string
  createdAt: string
  updatedAt: string
  settings: TeamSettings
}

export interface TeamSettings {
  defaultProjectVisibility: 'private' | 'team' | 'public'
  allowGuestAccess: boolean
  requireApprovalForDeployments: boolean
  enableAuditLog: boolean
  maxProjectSizeMB: number
  allowedDomains?: string[]
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  invitedBy: string
  invitedAt: string
  joinedAt?: string
  lastActiveAt?: string
  user: {
    email: string
    name: string
    avatarUrl?: string
  }
}

export interface TeamInvitation {
  id: string
  teamId: string
  email: string
  role: TeamRole
  invitedBy: string
  token: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  createdAt: string
}

export interface TeamActivity {
  id: string
  teamId: string
  userId: string
  action: string
  details?: Record<string, unknown>
  createdAt: string
  user: {
    name: string
    avatarUrl?: string
  }
}

export interface TeamUsage {
  teamId: string
  period: string // YYYY-MM
  creditsUsed: number
  projectsCreated: number
  deploymentsMade: number
  storageUsedMB: number
  apiCalls: number
  activeMembers: number
}

export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: [
    'team:manage',
    'team:delete',
    'billing:manage',
    'member:invite',
    'member:remove',
    'member:change_role',
    'project:create',
    'project:delete',
    'project:edit',
    'project:view',
    'project:deploy',
    'settings:manage',
    'audit:view',
  ],
  admin: [
    'member:invite',
    'member:remove',
    'project:create',
    'project:delete',
    'project:edit',
    'project:view',
    'project:deploy',
    'settings:manage',
    'audit:view',
  ],
  member: [
    'project:create',
    'project:edit',
    'project:view',
    'project:deploy',
  ],
  viewer: [
    'project:view',
  ],
}

export function hasPermission(role: TeamRole, permission: string): boolean {
  return TEAM_ROLE_PERMISSIONS[role].includes(permission) || 
         TEAM_ROLE_PERMISSIONS[role].includes('*')
}

import type { SubscriptionTier } from './billing'
