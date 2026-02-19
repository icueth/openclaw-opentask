import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getTaskById, updateTask, updateTaskStatus, processQueue } from '@/lib/taskQueue'
import { readTaskProgressFile } from '@/lib/taskRunner'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await params
    const body = await request.json()
    const { action } = body

    // Validate action
    const validActions = ['check', 'restart', 'force-complete', 'force-fail']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Get existing task
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify project matches
    if (task.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Task does not belong to this project' },
        { status: 403 }
      )
    }

    switch (action) {
      case 'check': {
        // Check progress from file
        const progressData = readTaskProgressFile(taskId)

        // Calculate how long task has been processing
        let processingDuration = null
        if (task.status === 'processing' && task.startedAt) {
          processingDuration = Math.floor(
            (Date.now() - new Date(task.startedAt).getTime()) / 1000 / 60
          ) // minutes
        }

        return NextResponse.json({
          success: true,
          info: {
            taskId: task.id,
            status: task.status,
            assignedAgent: task.assignedAgent,
            currentProgress: progressData?.percentage,
            currentStep: progressData?.message,
            processingDuration,
            isStuck: task.status === 'processing' && processingDuration && processingDuration > 5,
            lastUpdate: task.statusHistory[task.statusHistory.length - 1]
          }
        })
      }

      case 'restart': {
        // Only allow restart for stuck or failed tasks
        if (task.status !== 'processing' && task.status !== 'failed' && task.status !== 'cancelled') {
          return NextResponse.json(
            { success: false, error: `Cannot restart task with status: ${task.status}` },
            { status: 400 }
          )
        }

        // Clear progress for fresh start
        store.clearTaskProgress(taskId)

        // Reset task to pending
        updateTask(taskId, {
          status: 'pending',
          assignedAgent: undefined,
          error: undefined,
          retryCount: (task.retryCount || 0) + 1,
          completedAt: undefined
        })

        updateTaskStatus(taskId, 'pending', 'Task restarted by user')

        // Trigger queue processing
        await processQueue()

        return NextResponse.json({
          success: true,
          message: 'Task restarted and queued for processing',
          task: getTaskById(taskId)
        })
      }

      case 'force-complete': {
        // Only allow force-complete for processing tasks
        if (task.status !== 'processing' && task.status !== 'active' && task.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: `Cannot force-complete task with status: ${task.status}` },
            { status: 400 }
          )
        }

        const note = body.note || 'Force completed by user'

        updateTaskStatus(
          taskId,
          'completed',
          `Force completed: ${note}`,
          {
            result: note,
            completedAt: new Date().toISOString()
          }
        )
        
        // Also update progress to 100%
        store.updateTaskProgress(taskId, 100, note)

        return NextResponse.json({
          success: true,
          message: 'Task marked as completed',
          task: getTaskById(taskId)
        })
      }

      case 'force-fail': {
        // Only allow force-fail for processing or active tasks
        if (task.status !== 'processing' && task.status !== 'active' && task.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: `Cannot force-fail task with status: ${task.status}` },
            { status: 400 }
          )
        }

        const reason = body.reason || 'Force failed by user'

        updateTaskStatus(
          taskId,
          'failed',
          `Force failed: ${reason}`,
          {
            error: reason,
            completedAt: new Date().toISOString()
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Task marked as failed',
          task: getTaskById(taskId)
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('[Fix API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
