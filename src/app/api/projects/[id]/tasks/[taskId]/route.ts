import { NextRequest, NextResponse } from 'next/server'
import { getTaskById } from '@/lib/taskQueue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Get task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const task = getTaskById(params.taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify task belongs to this project
    if (task.projectId !== params.id) {
      return NextResponse.json(
        { error: 'Task does not belong to this project' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}
