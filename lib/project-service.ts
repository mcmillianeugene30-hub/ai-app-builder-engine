import { supabaseAdmin, supabaseClient, dbToProject, projectToDb } from './supabase'
import type { Project, ProjectFile, CreateProjectInput, UpdateProjectInput, ProjectListItem } from '@/types/project'

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Detect language from file extension
function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    sql: 'sql',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'bash',
    env: 'dotenv',
  }
  return languageMap[ext] || 'plaintext'
}

// Detect file type from path and content
function detectFileType(path: string): ProjectFile['type'] {
  const lowerPath = path.toLowerCase()
  if (lowerPath.includes('frontend') || lowerPath.includes('client') || lowerPath.includes('app')) {
    return 'frontend'
  }
  if (lowerPath.includes('backend') || lowerPath.includes('api') || lowerPath.includes('server')) {
    return 'backend'
  }
  if (lowerPath.includes('database') || lowerPath.includes('schema') || lowerPath.includes('migration')) {
    return 'database'
  }
  if (lowerPath.includes('config') || lowerPath.endsWith('.json') || lowerPath.endsWith('.env')) {
    return 'config'
  }
  return 'other'
}

/**
 * Create a new project from AI-generated output
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<Project> {
  const now = new Date().toISOString()
  const projectId = generateId()
  
  // Transform input files to full ProjectFile objects
  const files: ProjectFile[] = input.files.map((file, index) => ({
    id: generateId(),
    name: file.name,
    path: file.path,
    content: file.content,
    type: file.type || detectFileType(file.path),
    language: file.language || detectLanguage(file.name),
    createdAt: now,
    updatedAt: now,
  }))
  
  const project: Project = {
    id: projectId,
    userId,
    name: input.name,
    description: input.description,
    files,
    createdAt: now,
    updatedAt: now,
  }
  
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert(projectToDb(project))
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create project:', error)
    throw new Error(`Failed to create project: ${error.message}`)
  }
  
  return dbToProject(data)
}

/**
 * Save (update) an existing project
 */
export async function saveProject(
  projectId: string,
  updates: UpdateProjectInput
): Promise<Project> {
  const now = new Date().toISOString()
  
  const updateData: Partial<Project> = {
    updatedAt: now,
  }
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.files !== undefined) {
    // Update file timestamps
    updateData.files = updates.files.map(file => ({
      ...file,
      updatedAt: now,
    }))
  }
  
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(projectToDb(updateData))
    .eq('id', projectId)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to save project:', error)
    throw new Error(`Failed to save project: ${error.message}`)
  }
  
  return dbToProject(data)
}

/**
 * Load a project by ID
 */
export async function loadProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Failed to load project:', error)
    throw new Error(`Failed to load project: ${error.message}`)
  }
  
  return dbToProject(data)
}

/**
 * List all projects for a user
 */
export async function listProjects(userId: string): Promise<ProjectListItem[]> {
  const { data, error } = await supabaseClient
    .from('projects')
    .select('id, name, description, files, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Failed to list projects:', error)
    throw new Error(`Failed to list projects: ${error.message}`)
  }
  
  return data.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    fileCount: project.files?.length || 0,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }))
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', projectId)
  
  if (error) {
    console.error('Failed to delete project:', error)
    throw new Error(`Failed to delete project: ${error.message}`)
  }
}

/**
 * Add a new file to an existing project
 */
export async function addFileToProject(
  projectId: string,
  file: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProjectFile> {
  const now = new Date().toISOString()
  const newFile: ProjectFile = {
    id: generateId(),
    ...file,
    type: file.type || detectFileType(file.path),
    language: file.language || detectLanguage(file.name),
    createdAt: now,
    updatedAt: now,
  }
  
  // First get existing files
  const { data: existing, error: fetchError } = await supabaseClient
    .from('projects')
    .select('files')
    .eq('id', projectId)
    .single()
  
  if (fetchError) {
    throw new Error(`Failed to fetch project: ${fetchError.message}`)
  }
  
  const updatedFiles = [...(existing.files || []), newFile]
  
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ 
      files: updatedFiles.map(f => ({
        id: f.id,
        name: f.name,
        path: f.path,
        content: f.content,
        type: f.type,
        language: f.language,
        created_at: f.createdAt,
        updated_at: f.updatedAt,
      })),
      updated_at: now,
    })
    .eq('id', projectId)
  
  if (error) {
    throw new Error(`Failed to add file: ${error.message}`)
  }
  
  return newFile
}

/**
 * Delete a file from a project
 */
export async function deleteFileFromProject(projectId: string, fileId: string): Promise<void> {
  const now = new Date().toISOString()
  
  const { data: existing, error: fetchError } = await supabaseClient
    .from('projects')
    .select('files')
    .eq('id', projectId)
    .single()
  
  if (fetchError) {
    throw new Error(`Failed to fetch project: ${fetchError.message}`)
  }
  
  const updatedFiles = (existing.files || []).filter((f: ProjectFile) => f.id !== fileId)
  
  const { error } = await supabaseAdmin
    .from('projects')
    .update({
      files: updatedFiles,
      updated_at: now,
    })
    .eq('id', projectId)
  
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
