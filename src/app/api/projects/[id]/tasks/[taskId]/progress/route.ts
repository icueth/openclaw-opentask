import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { updateTaskStatus, getTaskById } from '@/lib/taskQueue'
import { readProgressLog } from '@/lib/progressMonitor'

/**
 * GET handler - Poll progress from log file
 * Used by frontend to get real-time progress updates for CLI-spawned tasks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await params

    // Get existing task
    const existingTask = getTaskById(taskId)
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify project matches
    if (existingTask.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Task does not belong to this project' },
        { status: 403 }
      )
    }

    // Read progress from log file
    const progressData = readProgressLog(taskId)
    
    if (!progressData) {
      // No progress log yet, return current task progress
      return NextResponse.json({
        success: true,
        progress: existingTask.progress,
        currentStep: existingTask.currentStep,
        status: existingTask.status,
        source: 'task'
      })
    }

    return NextResponse.json({
      success: true,
      progress: progressData.percentage,
      currentStep: progressData.message,
      timestamp: progressData.timestamp,
      status: existingTask.status,
      source: 'log'
    })
  } catch (error: any) {
    console.error('[Progress API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await params
    const body = await request.json()
    const { percentage, message } = body

    // Validate input
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid percentage (must be 0-100)' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get existing task
    const existingTask = getTaskById(taskId)
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify project matches
    if (existingTask.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Task does not belong to this project' },
        { status: 403 }
      )
    }

    // Update task progress
    const updatedTask = store.updateTaskProgress(taskId, percentage, message)

    // If progress is 100%, update status to completed
    if (percentage === 100) {
      updateTaskStatus(
        taskId,
        'completed',
        `Task completed: ${message}`,
        {
          result: message,
          completedAt: new Date().toISOString()
        }
      )
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    })
  } catch (error: any) {
    console.error('[Progress API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
