import { NextRequest, NextResponse } from 'next/server'
import { loadProject, addFileToProject, deleteFileFromProject } from '@/lib/project-service'
import type { ProjectFile } from '@/types/project'

export const runtime = 'edge'

// POST /api/projects/[id]/files - Add a new file to project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    if (!body.name || !body.path || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, path, content',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }
    
    const file = await addFileToProject(params.id, {
      name: body.name,
      path: body.path,
      content: body.content,
      type: body.type,
      language: body.language,
    })
    
    return NextResponse.json({
      success: true,
      data: file,
    })
  } catch (error) {
    console.error('Failed to add file:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add file',
        code: 'ADD_FILE_ERROR',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/files?fileId=xxx - Delete a file from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    
    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing fileId parameter',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }
    
    await deleteFileFromProject(params.id, fileId)
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete file:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
        code: 'DELETE_FILE_ERROR',
      },
      { status: 500 }
    )
  }
}
