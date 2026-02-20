import { NextResponse } from 'next/server'
import { getTaskById, updateTaskStatus } from '@/lib/taskQueue'
import { checkTaskStatusFromFile } from '@/lib/taskRunner'

// GET /api/projects/[id]/tasks/[taskId]/progress - Get real-time progress
export async function GET(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
    // Get task
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Task does not belong to this project' },
        { status: 403 }
      )
    }
    
    // Check for progress from status file (written by worker)
    const fileStatus = checkTaskStatusFromFile(taskId)
    
    if (fileStatus) {
      // Sync task status from file if it has changed
      if (fileStatus.status === 'completed' && task.status !== 'completed') {
        updateTaskStatus(taskId, 'completed', fileStatus.message || 'Task completed', {
          result: fileStatus.result,
          artifacts: fileStatus.artifacts
        })
      } else if (fileStatus.status === 'failed' && task.status !== 'failed') {
        updateTaskStatus(taskId, 'failed', fileStatus.message || 'Task failed', {
          error: fileStatus.message || 'Unknown error'
        })
      } else if (fileStatus.percentage !== undefined && fileStatus.percentage !== task.progress) {
        // Update progress percentage
        const tasks = require('@/lib/store').store.getTasks()
        const index = tasks.findIndex((t: any) => t.id === taskId)
        if (index !== -1) {
          tasks[index] = {
            ...tasks[index],
            progress: fileStatus.percentage,
            currentStep: fileStatus.message || tasks[index].currentStep
          }
          require('@/lib/store').store.writeTasks(tasks)
        }
      }
      
      return NextResponse.json({
        success: true,
        progress: fileStatus.percentage ?? 0,
        currentStep: fileStatus.message || task.currentStep,
        status: fileStatus.status || task.status,
        result: fileStatus.result,
        artifacts: fileStatus.artifacts,
        timestamp: Date.now(),
        source: 'file'
      })
    }
    
    // Fallback to task data
    return NextResponse.json({
      success: true,
      progress: task.progress ?? 0,
      currentStep: task.currentStep,
      status: task.status,
      timestamp: Date.now(),
      source: 'task'
    })
    
  } catch (error: any) {
    console.error('[Progress API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
