import { createClient } from '@supabase/supabase-js'
import type { DatabaseProject, DatabaseProjectFile, Project, ProjectFile } from '@/types/project'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side client (for browser)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side client (for API routes - admin privileges)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabaseClient

// Database to domain model conversion
export function dbToProject(dbProject: DatabaseProject): Project {
  return {
    id: dbProject.id,
    userId: dbProject.user_id,
    name: dbProject.name,
    description: dbProject.description || undefined,
    files: dbProject.files.map(dbToProjectFile),
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
  }
}

export function dbToProjectFile(dbFile: DatabaseProjectFile): ProjectFile {
  return {
    id: dbFile.id,
    name: dbFile.name,
    path: dbFile.path,
    content: dbFile.content,
    type: dbFile.type as ProjectFile['type'],
    language: dbFile.language,
    createdAt: dbFile.created_at,
    updatedAt: dbFile.updated_at,
  }
}

// Domain to database model conversion
export function projectToDb(project: Partial<Project>): Partial<DatabaseProject> {
  const dbProject: Partial<DatabaseProject> = {}
  
  if (project.id) dbProject.id = project.id
  if (project.userId) dbProject.user_id = project.userId
  if (project.name) dbProject.name = project.name
  if (project.description !== undefined) dbProject.description = project.description || null
  if (project.files) dbProject.files = project.files.map(projectFileToDb)
  if (project.createdAt) dbProject.created_at = project.createdAt
  if (project.updatedAt) dbProject.updated_at = project.updatedAt
  
  return dbProject
}

export function projectFileToDb(file: ProjectFile): DatabaseProjectFile {
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    content: file.content,
    type: file.type,
    language: file.language,
    created_at: file.createdAt,
    updated_at: file.updatedAt,
  }
}
