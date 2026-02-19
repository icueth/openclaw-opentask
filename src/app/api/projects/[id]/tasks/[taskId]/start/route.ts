import { NextResponse } from 'next/server'
import { getTaskById, updateTaskStatus } from '@/lib/taskQueue'
import { executeTask } from '@/lib/taskRunner'
import { store } from '@/lib/store'
import fs from 'fs'

// POST /api/projects/[id]/tasks/[taskId]/start - Manually start/restart task
export async function POST(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
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
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Update status and restart execution
    console.log(`[API] Manually starting task ${taskId}`)
    updateTaskStatus(taskId, 'pending', 'Task manually restarted')
    
    // Trigger execution
    executeTask(taskId, projectId, task.title, task.description || '').catch(err => {
      console.error(`[Start API] Execution error:`, err)
      updateTaskStatus(taskId, 'failed', err.message)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Task started and queued for processing',
      task: getTaskById(taskId)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}