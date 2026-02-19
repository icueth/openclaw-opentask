import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'
import fs from 'fs'
import path from 'path'

// GET /api/projects/[id]/tasks/[taskId]/status - Get task status
export async function GET(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
    // Get task
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Get task log if exists
    const taskContextDir = path.join(process.cwd(), 'data', 'task-contexts')
    const logFile = path.join(taskContextDir, `${taskId}.log`)
    let logContent = ''
    if (fs.existsSync(logFile)) {
      try {
        logContent = fs.readFileSync(logFile, 'utf-8')
      } catch (e) {
        // Ignore read errors
      }
    }
    
    return NextResponse.json({
      task,
      log: logContent || undefined
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
