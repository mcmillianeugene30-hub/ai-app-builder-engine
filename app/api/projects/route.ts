import { NextRequest, NextResponse } from 'next/server'
import { createProject, listProjects } from '@/lib/project-service'
import type { CreateProjectInput, Project } from '@/types/project'

export const runtime = 'edge'

// GET /api/projects - List all projects for current user
export async function GET(request: NextRequest) {
  try {
    // In production, get userId from auth session
    // For now, using header or query param for demo
    const userId = request.headers.get('x-user-id') || 'demo-user'
    
    const projects = await listProjects(userId)
    
    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error('Failed to list projects:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list projects',
        code: 'LIST_ERROR',
      },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user'
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.files || !Array.isArray(body.files)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, files',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }
    
    const input: CreateProjectInput = {
      name: body.name,
      description: body.description,
      files: body.files,
    }
    
    const project = await createProject(userId, input)
    
    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    )
  }
}
