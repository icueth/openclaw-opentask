import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import fs from 'fs'

interface FailTaskRequest {
  error: string
}

// POST /api/projects/[id]/tasks/[taskId]/fail - Mark task as failed
export async function POST(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    const body: FailTaskRequest = await request.json()
    
    console.log(`[Fail API] Task ${taskId} failure reported:`, body.error?.substring(0, 100))
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    // Get task
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Auto-set progress to 100% when failing (task is done, even if failed)
    await store.updateTaskProgress(taskId, 100, `Task failed: ${body.error || 'Unknown error'}`)
    
    // Mark as failed
    taskQueue.onTaskError(taskId, body.error || 'Unknown error')
    
    const failedTask = taskQueue.getTaskById(taskId)
    
    console.log(`[Fail API] Task ${taskId} marked as failed`)
    
    return NextResponse.json({
      success: true,
      message: 'Task marked as failed',
      task: failedTask
    })
  } catch (error: any) {
    console.error(`[Fail API] Error failing task:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}