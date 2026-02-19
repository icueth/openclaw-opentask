import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import fs from 'fs'

// POST /api/projects/[id]/tasks/[taskId]/start - Manually start task
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
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Start task
    console.log(`[API] Manually starting task ${taskId}`)
    taskQueue.startTask(taskId)
    
    // Immediately try to process queue
    console.log(`[API] Processing queue after manual start for task ${taskId}`)
    taskQueue.processQueue().then(() => {
      const updatedTask = taskQueue.getTaskById(taskId)
      console.log(`[API] Manual start processing complete for ${taskId}, status: ${updatedTask?.status}`)
    }).catch(err => {
      console.error(`[API] Error processing queue for manual start ${taskId}:`, err)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Task started and queued for processing',
      task: taskQueue.getTaskById(taskId)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}