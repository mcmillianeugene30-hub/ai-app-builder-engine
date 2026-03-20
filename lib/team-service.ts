import { supabaseAdmin, supabaseClient } from './supabase'
import type { Team, TeamMember, TeamInvitation, TeamActivity, TeamRole } from '@/types/team'
import { TEAM_ROLE_PERMISSIONS } from '@/types/team'

export async function createTeam(ownerId: string, name: string, slug: string) {
  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .insert({
      name,
      slug,
      owner_id: ownerId,
      subscription_tier: 'starter',
      settings: {
        defaultProjectVisibility: 'team',
        allowGuestAccess: false,
        requireApprovalForDeployments: false,
        enableAuditLog: true,
        maxProjectSizeMB: 100,
      },
    })
    .select()
    .single()

  if (error) throw error

  // Add owner as member
  await supabaseAdmin.from('team_members').insert({
    team_id: team.id,
    user_id: ownerId,
    role: 'owner',
    invited_by: ownerId,
    joined_at: new Date().toISOString(),
  })

  return team
}

export async function inviteTeamMember(
  teamId: string, 
  invitedBy: string, 
  email: string, 
  role: TeamRole
) {
  // Check if inviter has permission
  const { data: inviter } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', invitedBy)
    .single()

  if (!inviter || !hasPermission(inviter.role, 'member:invite')) {
    throw new Error('Insufficient permissions')
  }

  const token = crypto.randomUUID()
  
  const { data: invitation, error } = await supabaseAdmin
    .from('team_invitations')
    .insert({
      team_id: teamId,
      email,
      role,
      invited_by: invitedBy,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // TODO: Send email with invitation link
  // await sendInvitationEmail(email, token)

  return invitation
}

export async function acceptInvitation(token: string, userId: string) {
  const { data: invitation, error: inviteError } = await supabaseAdmin
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invitation) {
    throw new Error('Invalid or expired invitation')
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabaseAdmin
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    throw new Error('Invitation expired')
  }

  // Add member
  await supabaseAdmin.from('team_members').insert({
    team_id: invitation.team_id,
    user_id: userId,
    role: invitation.role,
    invited_by: invitation.invited_by,
    joined_at: new Date().toISOString(),
  })

  // Update invitation
  await supabaseAdmin
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return { success: true }
}

export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select(`
      *,
      user:user_id (
        email,
        raw_user_meta_data->>name as name,
        raw_user_meta_data->>avatar_url as avatarUrl
      )
    `)
    .eq('team_id', teamId)

  if (error) throw error
  return data
}

export async function removeTeamMember(teamId: string, memberId: string, removedBy: string) {
  // Check permissions
  const { data: remover } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', removedBy)
    .single()

  if (!remover || !hasPermission(remover.role, 'member:remove')) {
    throw new Error('Insufficient permissions')
  }

  await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('id', memberId)

  return { success: true }
}

export async function changeMemberRole(
  teamId: string, 
  memberId: string, 
  newRole: TeamRole, 
  changedBy: string
) {
  // Check permissions
  const { data: changer } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', changedBy)
    .single()

  if (!changer || !hasPermission(changer.role, 'member:change_role')) {
    throw new Error('Insufficient permissions')
  }

  await supabaseAdmin
    .from('team_members')
    .update({ role: newRole })
    .eq('id', memberId)

  return { success: true }
}

export async function getUserTeams(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select(`
      role,
      team:team_id (*)
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data
}

export function hasPermission(role: TeamRole, permission: string): boolean {
  return TEAM_ROLE_PERMISSIONS[role].includes(permission)
}

export async function logTeamActivity(
  teamId: string, 
  userId: string, 
  action: string, 
  details?: Record<string, unknown>
) {
  await supabaseAdmin.from('team_activities').insert({
    team_id: teamId,
    user_id: userId,
    action,
    details,
  })
}
