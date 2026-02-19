import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getTaskById, updateTaskStatus } from '@/lib/taskQueue'
import { checkTaskStatusFromFile, executeTask } from '@/lib/taskRunner'

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
        const progressData = checkTaskStatusFromFile(taskId)

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
            currentStep: progressData?.message || task.currentStep,
            processingDuration,
            isStuck: task.status === 'processing' && processingDuration !== null && processingDuration > 5
          }
        })
      }

      case 'restart': {
        // Only allow restart for stuck or failed tasks
        if (task.status !== 'processing' && task.status !== 'failed') {
          return NextResponse.json(
            { success: false, error: `Cannot restart task with status: ${task.status}` },
            { status: 400 }
          )
        }

        // Reset task to pending and re-execute
        updateTaskStatus(taskId, 'pending', 'Task restarted by user')

        // Re-trigger execution
        executeTask(taskId, projectId, task.title, task.description || '').catch(err => {
          console.error(`[Fix API] Restart execution error:`, err)
          updateTaskStatus(taskId, 'failed', err.message)
        })

        return NextResponse.json({
          success: true,
          message: 'Task restarted and queued for processing',
          task: getTaskById(taskId)
        })
      }

      case 'force-complete': {
        // Only allow force-complete for processing tasks
        if (task.status !== 'processing' && task.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: `Cannot force-complete task with status: ${task.status}` },
            { status: 400 }
          )
        }

        const note = body.note || 'Force completed by user'

        updateTaskStatus(
          taskId,
          'completed',
          `Force completed: ${note}`
        )

        return NextResponse.json({
          success: true,
          message: 'Task marked as completed',
          task: getTaskById(taskId)
        })
      }

      case 'force-fail': {
        // Only allow force-fail for processing or pending tasks
        if (task.status !== 'processing' && task.status !== 'pending') {
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
          { error: reason }
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
