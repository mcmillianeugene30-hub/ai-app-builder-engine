import { NextRequest, NextResponse } from 'next/server'
import { loadProject, saveProject, deleteProject } from '@/lib/project-service'
import type { UpdateProjectInput } from '@/types/project'

export const runtime = 'edge'

// GET /api/projects/[id] - Load a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await loadProject(params.id)
    
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Failed to load project:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load project',
        code: 'LOAD_ERROR',
      },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const updates: UpdateProjectInput = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.files !== undefined) updates.files = body.files
    
    const project = await saveProject(params.id, updates)
    
    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
        code: 'UPDATE_ERROR',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProject(params.id)
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    )
  }
}
